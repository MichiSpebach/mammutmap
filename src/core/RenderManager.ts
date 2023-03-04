import { dom, BatchMethod, MouseEventType, DragEventType, WheelEventType, InputEventType, MouseEventResultAdvanced } from './domAdapter'
import { ClientRect } from './ClientRect'
import { RenderElement, RenderElements } from './util/RenderElement'
import { ClientPosition } from './shape/ClientPosition'

export { MouseEventType, DragEventType, WheelEventType, InputEventType, MouseEventResultAdvanced }

export class RenderManager {
  private commands: Command[] = []

  public isReady(): boolean {
    return !!dom
  }

  public getPendingCommandsCount(): number {
    return this.commands.length
  }

  public openDevTools(): void {
    dom.openDevTools()
  }

  public getClientSize(): {width: number, height: number} {
    return dom.getClientSize()
  }

  public getCursorClientPosition(): ClientPosition {
    const position: {x: number, y: number} = dom.getCursorClientPosition()
    return new ClientPosition(position.x, position.y)
  }

  public isElementHovered(id: string): Promise<boolean> {
    return dom.isElementHovered(id)
  }

  public getClientRectOf(id: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<ClientRect> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'getClientRectOf'+id,
      command: () => dom.getClientRectOf(id)
    }))
  }

  public getValueOf(id: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<string> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'getValueOf'+id,
      command: () => dom.getValueOf(id)
    }))
  }

  public appendChildTo(parentId: string, childId: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'appendChildTo'+childId,
      batchParameters: {elementId: parentId, method: 'appendChildTo', value: childId},
      command: () => dom.appendChildTo(parentId, childId)
    }))
  }

  public addContentTo(id: string, content: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      // updatableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
      batchParameters: {elementId: id, method: 'addContentTo', value: content},
      command: () => dom.addContentTo(id, content)
    }))
  }

  public addElementsTo(id: string, elements: RenderElements, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      // updatableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
      batchParameters: {elementId: id, method: 'addElementsTo', value: elements},
      command: () => dom.addElementsTo(id, elements)
    }))
  }

  public addElementTo(id: string, element: RenderElement, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      // updatableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
      batchParameters: {elementId: id, method: 'addElementTo', value: element},
      command: () => dom.addElementTo(id, element)
    }))
  }

  public setElementsTo(id: string, elements: RenderElements, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      // squashableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
      batchParameters: {elementId: id, method: 'setElementsTo', value: elements},
      command: () => dom.setElementsTo(id, elements)
    }))
  }

  public setElementTo(id: string, element: RenderElement, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      // squashableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
      batchParameters: {elementId: id, method: 'setElementTo', value: element},
      command: () => dom.setElementTo(id, element)
    }))
  }

  public setContentTo(id: string, content: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      // squashableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
      batchParameters: {elementId: id, method: 'innerHTML', value: content},
      command: () => dom.setContentTo(id, content)
    }))
  }

  public clearContentOf(id: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      // squashableWith: 'setContentOrElementTo'+id, // not sure about this, could break setStyleTo(id) and addClassTo(id)
      batchParameters: {elementId: id, method: 'innerHTML', value: ''},
      command: () => dom.clearContentOf(id)
    }))
  }

  public remove(id: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      command: () => dom.remove(id)
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

  public addClassTo(id: string, className: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'addClass'+className+'to'+id,
      updatableWith: 'removeClass'+className+'from'+id,
      batchParameters: {elementId: id, method: 'addClassTo', value: className},
      command: () => dom.addClassTo(id, className)
    }))
  }

  public removeClassFrom(id: string, className: string, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      squashableWith: 'removeClass'+className+'from'+id,
      updatableWith: 'addClass'+className+'to'+id,
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

  public addChangeListenerTo<RETURN_TYPE>(
    id: string,
    returnField: 'value'|'checked',
    callback: (value: RETURN_TYPE) => void,
    priority: RenderPriority = RenderPriority.NORMAL
  ): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      command: () => dom.addChangeListenerTo<RETURN_TYPE>(id, returnField, callback)
    }))
  }

  public addWheelListenerTo(
    id: string,
    callback: (delta: number, clientX: number, clientY: number) => void,
    priority: RenderPriority = RenderPriority.NORMAL
  ): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      command: () => dom.addWheelListenerTo(id, callback)
    }))
  }

  public addEventListenerAdvancedTo(
    id: string,
    eventType: MouseEventType,
    {priority = RenderPriority.NORMAL, stopPropagation, capture}: {priority?: RenderPriority, stopPropagation: boolean, capture?: boolean},
    callback: (result: MouseEventResultAdvanced) => void
  ): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      command: () => dom.addEventListenerAdvancedTo(id, eventType, {stopPropagation, capture}, callback)
    }))
  }

  public addEventListenerTo(
    id: string,
    eventType: MouseEventType,
    callback: (clientX:number, clientY: number, ctrlPressed: boolean) => void,
    priority: RenderPriority = RenderPriority.NORMAL
  ): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      command: () => dom.addEventListenerTo(id, eventType, callback)
    }))
  }

  public async addDragListenerTo(
    id: string,
    eventType: DragEventType,
    callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void,
    priority: RenderPriority = RenderPriority.NORMAL
  ): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      command: () => dom.addDragListenerTo(id, eventType, callback)
    }))
  }

  public removeEventListenerFrom(
    id: string,
    eventType: MouseEventType|DragEventType|WheelEventType|InputEventType,
    priority: RenderPriority = RenderPriority.NORMAL
  ): Promise<void> {
    return this.runOrSchedule(new Command({
      priority: priority,
      command: () => dom.removeEventListenerFrom(id, eventType)
    }))
  }

  public async runOrSchedule<T>(command: Command): Promise<T> { // only public for unit tests
    const updatedCommand: Command|undefined = this.tryToUpdateQueuedCommands(command)
    if (updatedCommand) {
      return updatedCommand.promise.get()
    }

    const squashedCommand: Command|undefined = this.tryToSquashIntoQueuedCommands(command)
    if (squashedCommand) {
      return squashedCommand.promise.get()
    }

    this.addCommand(command)

    const commandCanBeStarted: Promise<any>|{minPriority?: RenderPriority} = this.blockUntilCommandCanBeStarted(command)
    if (commandCanBeStarted instanceof Promise) {
      await commandCanBeStarted
    } else {
      var minPriority: RenderPriority|undefined = commandCanBeStarted.minPriority
    }

    if (!command.promise.isStarted()) { // if command was batched into another command, promise is already started
      // TODO: is always true with current implementation becuase command was modified by command it was batched into to directly resolve, change implementation or remove condition
      this.batchUpcommingCommandsInto(command, minPriority)
      command.promise.run()
    }
    command.promise.get().then(() => this.commands.splice(this.commands.indexOf(command), 1)) // TODO: check that no race conditions occur, improve
    return command.promise.get()
  }

  public addCommand(command: Command): void { // only public for unit tests
    let i = 0
    for(; i < this.commands.length; i++) {
      const queuedCommand: Command = this.commands[i]
      if(command.priority > queuedCommand.priority && !queuedCommand.promise.isStarted()) {
        break
      }
    }
    this.commands.splice(i, 0, command)
  }

  private blockUntilCommandCanBeStarted(command: Command): Promise<any>|{minPriority?: RenderPriority} {
    const maxStartedCommandsCount = 3
    const indexToWaitFor: number = this.commands.indexOf(command)-1
    if (indexToWaitFor >= 0) {
      if (command.priority >= RenderPriority.RESPONSIVE) {
        const startedCommandsCount: number = this.commands.filter(command => command.promise.isStarted()).length
        if (startedCommandsCount < maxStartedCommandsCount) {
          return {minPriority: RenderPriority.RESPONSIVE}
        }
      }
      return this.commands[indexToWaitFor].promise.get()
    }
    return {}
  }

  // TODO: remove and simply use tryToUpdateQueuedCommands(..)
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
        compareCommand.batchParameters = command.batchParameters
        compareCommand.promise.setCommand(command.promise.getCommand())
        this.increasePriorityOfCommandIfNecessary(compareCommand, command.priority)
        return compareCommand
      }
    }

    return undefined
  }

  private tryToUpdateQueuedCommands(command: Command): Command|undefined {
    if (!command.updatableWith) {
      return undefined
    }

    for (let i = 0; i < this.commands.length; i++) {
      const compareCommand: Command = this.commands[i]
      if (compareCommand.promise.isStarted()) {
        continue
      }
      if (compareCommand.updatableWith == command.squashableWith) {
        compareCommand.updatableWith = command.updatableWith
        compareCommand.squashableWith = command.squashableWith
        compareCommand.batchParameters = command.batchParameters
        compareCommand.promise.setCommand(command.promise.getCommand())
        this.increasePriorityOfCommandIfNecessary(compareCommand, command.priority)
        return compareCommand
      }
    }

    return undefined
  }

  private increasePriorityOfCommandIfNecessary(command: Command, newPriority: RenderPriority): void {
    if (newPriority <= command.priority.valueOf()) {
      return
    }
    command.priority = newPriority

    const indexOfCommand: number = this.commands.indexOf(command)
    if (indexOfCommand === -1) {
      throw Error('trying to resort command that is not contained in commands, this should never happen')
    }

    for(let i = 0; i < indexOfCommand && this.commands.length; i++) {
      if(command.priority > this.commands[i].priority) {
        this.commands.splice(this.commands.indexOf(command), 1)
        this.commands.splice(i, 0, command)
        return
      }
    }
  }

  private batchUpcommingCommandsInto(command: Command, minPriority?: RenderPriority): void {
    if (!command.batchParameters) {
      return
    }

    const maxBatchSize: number = 100
    const batch: {elementId: string, method: BatchMethod, value: string|RenderElement|RenderElements}[] = []
    let originalCommandAdded: boolean = false

    for (let i: number = 0; i < this.commands.length && batch.length < maxBatchSize; i++) {
      const upcommingCommand: Command = this.commands[i]

      if (upcommingCommand.batchParameters) {
        if (upcommingCommand.promise.isStarted() || (minPriority && command.priority < minPriority)) {
          continue
        }
        batch.push(upcommingCommand.batchParameters)
        upcommingCommand.squashableWith = undefined
        upcommingCommand.updatableWith = undefined
        upcommingCommand.batchParameters = undefined
        if (upcommingCommand !== command) {
          upcommingCommand.promise.setCommand(() => Promise.resolve())
        } else {
          originalCommandAdded = true
        }
      }
    }

    if (!originalCommandAdded) { // prevents original command from being squeezed out if there are a lot of higher prioritized commands
      batch.push(command.batchParameters)
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
  public updatableWith: string|undefined
  public batchParameters: {elementId: string, method: BatchMethod, value: string|RenderElement|RenderElements} | undefined
  public readonly promise: SchedulablePromise<Promise<any>>

  public constructor(options: {
    priority: RenderPriority,
    squashableWith?: string,
    updatableWith?: string,
    batchParameters?: {elementId: string, method: BatchMethod, value: string|RenderElement|RenderElements},
    command: () => Promise<any>
  }) {
    this.priority = options.priority
    this.squashableWith = options.squashableWith
    this.updatableWith = options.updatableWith
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
