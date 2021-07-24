import * as util from './util'
import { dom } from './domAdapter'
import { Rect } from './Rect'

export class RenderManager {
  private commands: Command[] = []
  private latestPromise: Promise<any> = Promise.resolve()

  public getClientSize(): {width: number, height: number} {
    return dom.getClientSize()
  }

  public getClientRectOf(id: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<Rect> {
    return this.runOrSchedule(new Command(priority, 'getClientRectOf'+id, () => dom.getClientRectOf(id)))
  }

  public appendChildTo(parentId: string, childId: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command(priority, 'appendChildTo'+childId, () => dom.appendChildTo(parentId, childId)))
  }

  public addContentTo(id: string, content: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command(priority, undefined, () => dom.addContentTo(id, content)))
  }

  public setContentTo(id: string, content: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command(priority, 'setContentTo'+id, () => dom.setContentTo(id, content)))
  }

  public setStyleTo(id: string, style: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command(priority, 'setStyleTo'+id, () => dom.setStyleTo(id, style)))
  }

  public addClassTo(id: string, className: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command(priority, undefined, () => dom.addClassTo(id, className)))
  }

  public removeClassFrom(id: string, className: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command(priority, undefined, () => dom.removeClassFrom(id, className)))
  }

  public scrollToBottom(id: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command(priority, undefined, () => dom.scrollToBottom(id)))
  }

  public async runOrSchedule<T>(command: Command): Promise<T> { // only public for unit tests
    const squashedCommand: Command|undefined = this.tryToSquashIntoQueuedCommands(command)
    if (squashedCommand) {
      return squashedCommand.promise.get()
    }

    this.addCommand(command)

    // TODO: improve implementation, squishy behavior when higher prioritized command is added
    const indexToWaitFor: number = this.commands.indexOf(command)-1
    if (indexToWaitFor >= 0) {
      await this.commands[indexToWaitFor].promise.get()
    }

    command.promise.run()
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
        compareCommand.priority = Math.max(compareCommand.priority.valueOf(), command.priority.valueOf())
        compareCommand.promise.setCommand(command.promise.getCommand())
        return compareCommand
      }
    }

    return undefined
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
  public readonly squashableWith: string|undefined
  public readonly promise: SchedulablePromise<Promise<any>>

  public constructor(priority: RenderPriority, squashableWith: string|undefined, command: () => Promise<any>) {
    this.priority = priority
    this.squashableWith = squashableWith
    this.promise = new SchedulablePromise(command)
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
