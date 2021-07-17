import * as util from './util'
import { dom } from './domAdapter'
import { Rect } from './Rect'

export class RenderManager {
  private commands: Command[] = []
  private latestPromise: Promise<any> = Promise.resolve()

  public getClientSize(): {width: number, height: number} {
    return dom.getClientSize()
  }

  public getClientRectOf(id: string): Promise<Rect> {
    return this.runOrSchedule(new Command(id, 1, 'getClientRect', () => dom.getClientRectOf(id)))
  }

  public appendChildTo(parentId: string, childId: string): Promise<void> {
    return this.runOrSchedule(new Command(childId, 1, 'appendChild', () => dom.appendChildTo(parentId, childId)))
  }

  public addContentTo(id: string, content: string): Promise<void> {
    return this.runOrSchedule(new Command(id, 1, 'addContent', () => dom.addContentTo(id, content)))
  }

  public setContentTo(id: string, content: string): Promise<void> {
    return this.runOrSchedule(new Command(id, 1, 'setContent', () => dom.setContentTo(id, content)))
  }

  public setStyleTo(id: string, style: string, priority: number = 1): Promise<void> {
    return this.runOrSchedule(new Command(id, priority, 'setStyle', () => dom.setStyleTo(id, style)))
  }

  public addClassTo(id: string, className: string): Promise<void> {
    return this.runOrSchedule(new Command(id, 1, 'addClass', () => dom.addClassTo(id, className)))
  }

  public removeClassFrom(id: string, className: string): Promise<void> {
    return this.runOrSchedule(new Command(id, 1, 'removeClass', () => dom.removeClassFrom(id, className)))
  }

  public scrollToBottom(id: string): Promise<void> {
    return this.runOrSchedule(new Command(id, 1, 'scrollToBottom', () => dom.scrollToBottom(id)))
  }

  public async runOrSchedule<T>(command: Command): Promise<T> { // only public for unit tests
    // TODO: improve implementation, squishy behavior when higher prioritized command is added, commands is never shifted/emptied
    this.addCommand(command)

    const indexToWaitFor: number = this.commands.indexOf(command)-1
    if (indexToWaitFor >= 0) {
      await this.commands[indexToWaitFor].promise.get()
    }

    command.promise.run()
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

  public getCommands(): Command[] { // only public for unit tests
    return this.commands
  }

}

export class SchedulablePromise<T> { // only export for unit tests
  private promise: Promise<T>
  private resolve: ((value: T) => void) | undefined
  private command: () => T

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
    const result: T = this.command()
    if (!this.resolve) {
      throw Error('resolve function is still undefined, this should be impossible at this state')
    }
    this.resolve(result)
  }

}

export class Command { // only export for unit tests
  public readonly affectedElementId: string
  public priority: number
  public readonly type: string
  public readonly promise: SchedulablePromise<Promise<any>>

  public constructor(affectedElementId: string, priority: number, type: string, command: () => Promise<any>) {
    this.affectedElementId = affectedElementId
    this.priority = priority
    this.type = type
    this.promise = new SchedulablePromise(command)
  }
}

export let renderManager: RenderManager = new RenderManager()

export function init(object: RenderManager): void {
  renderManager = object
}
