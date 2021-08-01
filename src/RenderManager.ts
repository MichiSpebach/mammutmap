import { dom, BatchMethod } from './domAdapter'
import { Rect } from './Rect'

export class RenderManager {
  private commands: Command[] = []

  public getClientSize(): {width: number, height: number} {
    return dom.getClientSize()
  }

  public getClientRectOf(id: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<Rect> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'getClientRectOf'+id,
      command: () => dom.getClientRectOf(id)
    }))
  }

  public appendChildTo(parentId: string, childId: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'appendChildTo'+childId,
      command: () => dom.appendChildTo(parentId, childId)
    }))
  }

  public addContentTo(id: string, content: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      command: () => dom.addContentTo(id, content)
    }))
  }

  public setContentTo(id: string, content: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'setContentTo'+id,
      batchParameters: {elementId: id, method: 'innerHTML', value: content},
      command: () => dom.setContentTo(id, content)
    }))
  }

  public setStyleTo(id: string, style: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'setStyleTo'+id,
      batchParameters: {elementId: id, method: 'style', value: style},
      command: () => dom.setStyleTo(id, style)
    }))
  }

  /** notice: a sequel like addClass, removeClass, removeClass, addClass could be completely neutralized, the last addClass is NOT save to be executed */
  public addClassTo(id: string, className: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'addClass'+className+'to'+id,
      neutralizableWith: 'removeClass'+className+'from'+id,
      batchParameters: {elementId: id, method: 'addClassTo', value: className},
      command: () => dom.addClassTo(id, className)
    }))
  }

  /** notice: a sequel like addClass, removeClass, removeClass, addClass could be completely neutralized, the last addClass is NOT save to be executed */
  public removeClassFrom(id: string, className: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'removeClass'+className+'from'+id,
      neutralizableWith: 'addClass'+className+'to'+id,
      batchParameters: {elementId: id, method: 'removeClassFrom', value: className},
      command: () => dom.removeClassFrom(id, className)
    }))
  }

  public scrollToBottom(id: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      command: () => dom.scrollToBottom(id)
    }))
  }

  public async runOrSchedule<T>(command: Command): Promise<T> { // only public for unit tests
    const squashedCommand: Command|undefined = this.tryToSquashIntoQueuedCommands(command)
    if (squashedCommand) {
      return squashedCommand.promise.get()
    }

    const neutralizedCommand: Command|undefined = this.tryToNeutralizeWithQueuedCommands(command)
    if (neutralizedCommand) {
      return neutralizedCommand.promise.get()
    }

    this.addCommand(command)

    // TODO: improve implementation, squishy behavior when higher prioritized command is added
    const indexToWaitFor: number = this.commands.indexOf(command)-1
    if (indexToWaitFor >= 0) {
      await this.commands[indexToWaitFor].promise.get()
    }

    this.batchUpcommingCommandsInto(command)
    if (!command.promise.isStarted()) { // if command was batched into another command, promise is already started
      command.promise.run()
    }
    command.promise.get().then(() => this.commands.splice(this.commands.indexOf(command), 1)) // TODO: check that no race conditions occur, improve
    return command.promise.get()
  }

  public addCommand(command: Command): void { // only public for unit tests
    let i = 0
    for(; i < this.commands.length; i++) {
      if(command.priority > this.commands[i].priority) {
        break
      }
    }
    this.commands.splice(i, 0, command)
  }

  private tryToSquashIntoQueuedCommands(command: Command): Command|undefined {
    if (!command.squashableWith) {
      return undefined
    }

    for (let i = 0; i < this.commands.length; i++) {
      const compareCommand: Command = this.commands[i]
      if (compareCommand.promise.isStarted()) {
        continue
      }
      if (compareCommand.squashableWith == command.squashableWith) {
        compareCommand.priority = Math.max(compareCommand.priority.valueOf(), command.priority.valueOf()) // TODO: command should also be resorted in queue
        compareCommand.promise.setCommand(command.promise.getCommand())
        return compareCommand
      }
    }

    return undefined
  }

  // TODO: a sequel like addClass, removeClass, removeclass, addClass could be completely neutralized, but last addClass should be executed
  private tryToNeutralizeWithQueuedCommands(command: Command): Command|undefined {
    if (!command.neutralizableWith) {
      return undefined
    }

    for (let i = 0; i < this.commands.length; i++) {
      const compareCommand: Command = this.commands[i]
      if (compareCommand.promise.isStarted()) {
        continue
      }
      if (compareCommand.neutralizableWith == command.squashableWith) {
        compareCommand.neutralizableWith = undefined
        compareCommand.squashableWith = undefined
        compareCommand.priority = Math.max(compareCommand.priority.valueOf(), command.priority.valueOf()) // TODO: command should also be resorted in queue
        compareCommand.promise.setCommand(() => Promise.resolve())
        return compareCommand
      }
    }

    return undefined
  }

  private batchUpcommingCommandsInto(command: Command): void {
    if (!command.batchParameters) {
      return
    }

    const maxBatchSize: number = 100
    const batch: {elementId: string, method: BatchMethod, value: string}[] = [command.batchParameters]

    for (let i: number = this.commands.indexOf(command)+1; i < this.commands.length && batch.length < maxBatchSize; i++) {
      const upcommingCommand: Command = this.commands[i]

      if (upcommingCommand.batchParameters) {
        batch.push(upcommingCommand.batchParameters)
        upcommingCommand.squashableWith = undefined
        upcommingCommand.neutralizableWith = undefined
        upcommingCommand.batchParameters = undefined
        upcommingCommand.promise.setCommand(() => Promise.resolve())
      }
    }

    if (batch.length > 1) {
      command.promise.setCommand(() => dom.batch(batch))
    }
  }

  public getCommands(): Command[] { // only public for unit tests
    return this.commands
  }

}

export enum RenderPriority {
  NORMAL = 1,
  RESPONSIVE = 2
}

export class Command { // only export for unit tests
  public priority: RenderPriority
  public squashableWith: string|undefined
  public neutralizableWith: string|undefined
  public batchParameters: {elementId: string, method: BatchMethod, value: string}|undefined
  public readonly promise: SchedulablePromise<Promise<any>>

  public constructor(options: {
    priority: RenderPriority,
    squashableWith?: string,
    neutralizableWith?: string,
    batchParameters?: {elementId: string, method: BatchMethod, value: string},
    command: () => Promise<any>
  }) {
    this.priority = options.priority
    this.squashableWith = options.squashableWith
    this.neutralizableWith = options.neutralizableWith
    this.batchParameters = options.batchParameters
    this.promise = new SchedulablePromise(options.command)
  }
}

export class SchedulablePromise<T> { // only export for unit tests
  private promise: Promise<T>
  private resolve: ((value: T) => void) | undefined
  private command: () => T
  private started: boolean = false

  public constructor(command: () => T) {
    this.promise = new Promise((resolve: (value: T) => void) => {
      this.resolve = resolve
    })
    this.command = command
  }

  public get(): Promise<T> {
    return this.promise
  }

  public run(): void {
    this.started = true
    const result: T = this.command()
    if (!this.resolve) {
      throw Error('resolve function is still undefined, this should be impossible at this state')
    }
    this.resolve(result)
  }

  public getCommand(): () => T {
    return this.command
  }

  public setCommand(command: () => T): void {
    this.command = command
  }

  public isStarted(): boolean {
    return this.started
  }

}

export let renderManager: RenderManager = new RenderManager()

export function init(object: RenderManager): void {
  renderManager = object
}
