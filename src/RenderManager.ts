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
    return command.command() // TODO: wip, remove this line and make below work

    // TODO: wip, this is very inefficient, improve
    this.addCommand(command)

    for(let waits: number = 1; this.commands[0] !== command; waits++) {
      await this.latestPromise
      await util.wait(0)
      if (waits%1000 == 0) {
        util.logWarning('waiting '+waits+' times to run command')
      }
    }

    const promise: Promise<any> = command.command()
    await promise
    if (this.commands.shift() === undefined) {
      util.logError('lost command, this should never happen')
    }
    this.latestPromise = promise // TODO: check that race conditions are impossible or improve
    return promise
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

export class Command { // only export for unit tests
  public readonly affectedElementId: string
  public priority: number
  public readonly type: string
  public command: () => Promise<any>

  public constructor(affectedElementId: string, priority: number, type: string, command: () => Promise<any>) {
    this.affectedElementId = affectedElementId
    this.priority = priority
    this.type = type
    this.command = command
  }
}

export let renderManager: RenderManager = new RenderManager()

export function init(object: RenderManager): void {
  renderManager = object
}
