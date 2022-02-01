import { exec } from 'child_process'
import { renderManager } from './RenderManager'
import { style } from './styleAdapter'

class Util {
  private logDebugActivated: boolean = false

  public runShellCommand(command: string) {
    exec(command)
  }

  public setLogDebugActivated(activated: boolean): void {
    this.logDebugActivated = activated
  }

  public logDebug(message: string): void {
    if (this.logDebugActivated) {
      this.log('debug: ' + message, 'grey', 'log')
    }
  }

  public logInfo(message: string): void {
    this.log('Info: ' + message, 'grey', 'log')
  }

  public logWarning(message: string): void {
    this.log('WARNING: ' + message, 'orange', 'trace')
  }

  public logError(message: string): never {
    this.log('ERROR: ' + message, 'red', 'trace')
    throw new Error(message)
  }

  private async log(message: string, color: string, mode: 'log'|'trace'): Promise<void> {
    if (mode === 'log') {
      console.log(message)
    } else {
      console.trace(message)
    }

    const division: string = '<div style="color:' + color + '">'+this.escapeForHtml(message)+'</div>'
    await renderManager.addContentTo('log', division)
    await renderManager.scrollToBottom('terminal')
  }

  // TODO: move to HintManager/HintComponent
  public readonly hintToDeactivateSnapToGrid: string = 'Press CTRL to deactivate snapToGrid'
  private readonly hintId: string = 'hint'
  private hint: string|null = null
  public async setHint(hint: string, active: boolean): Promise<void> {
    if (active) {
      if (!this.hint) {
        this.hint = hint
        await renderManager.addContentTo('body', `<div id="${this.hintId}" class="${style.getHintClass()}">${hint}</div>`)
      } else if (this.hint !== hint) {
        this.hint = hint
        await renderManager.setContentTo(this.hintId, hint)
      }
    } else {
      if (this.hint === hint) {
        this.hint = null
        await renderManager.remove(this.hintId)
      }
    }
  }

  public stringify(object: any): string {
    var stringifiedObject: string = object + ': '
    for (var key in object) {
      //if(typeof rect[key] !== 'function') {
        stringifiedObject += key + '=' + object[key] + '; '
      //}
    }
    return stringifiedObject
  }

  public escapeForHtml(text: string): string {
    var content: string = '';
    for (let i = 0; i < text.length; i++) {
      // TODO this is maybe very inefficient
      content += this.escapeCharForHtml(text[i])
    }
    return content
  }

  private escapeCharForHtml(c: string): string {
    switch (c) {
      case '\\':
        return '&#92;'
      case '\n':
        return '<br/>'
      case '\r':
        return ''
      case '\'':
        return '&#39;'
      case '"':
        return '&quot;'
      case '`':
        return '&#96;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp'
      default:
        return c
    }
  }

  public joinPaths(paths: string[]): string {
    let jointedPath: string = ''
    for (let path of paths) {
      if (jointedPath !== '') {
        if (!jointedPath.endsWith('/') && !path.startsWith('/')) {
          jointedPath += '/'
        } else if (jointedPath.endsWith('/') && path.startsWith('/')) {
          path = path.substring(1)
        }
        if (path.startsWith('../')) {
          jointedPath = this.removeLastElementFromPath(jointedPath)
          path = path.substring(3)
        }
        if (path.startsWith('./')) {
          path = path.substring(2)
        }
      }
      jointedPath += path
    }
    return jointedPath
  }

  public removeLastElementFromPath(path: string): string {
    return path.replace(/[/][^/]*.$/, '/')
  }

  public toFormattedJson(object: any) {
    return JSON.stringify(object, null, '\t')
  }

  public wait(milliSeconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliSeconds))
  }

  public generateId(): string {
    return Math.random().toString(32).substring(2)
  }

}

export let util: Util = new Util()
