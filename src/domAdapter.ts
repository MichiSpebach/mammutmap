import { util } from './util'
import { BrowserWindow, WebContents, Point, Rectangle, screen, ipcMain, IpcMainEvent } from 'electron'
import { ClientRect } from './ClientRect'

export type BatchMethod = 'innerHTML'|'style'|'addClassTo'|'removeClassFrom'

export let dom: DocumentObjectModelAdapter

export function initFromBrowserWindow(windowToRenderIn: BrowserWindow): void {
  dom = new DocumentObjectModelAdapter(windowToRenderIn)
}

export function init(object: DocumentObjectModelAdapter): void {
  dom = object
}

export class DocumentObjectModelAdapter {
  private renderWindow: BrowserWindow
  private webContents: WebContents
  private ipcChannels: string[] = []

  public constructor(windowToRenderIn: BrowserWindow) {
    this.renderWindow = windowToRenderIn
    this.webContents = this.renderWindow.webContents
    // TODO: define 'let ipc = require("electron").ipcRenderer;' in renderer only once
  }

  public openDevTools(): void {
    this.webContents.openDevTools()
  }

  public getClientSize(): {width: number, height: number} {
    const size: number[] = this.renderWindow.getContentSize()
    return {width: size[0], height: size[1]}
  }

  public getCursorClientPosition(): {x: number, y: number} {
    const cursorScreenPosition: Point = screen.getCursorScreenPoint()
    const contentBounds: Rectangle = this.renderWindow.getContentBounds()

    return {x: cursorScreenPosition.x - contentBounds.x, y: cursorScreenPosition.y - contentBounds.y}
  }

  public async getClientRectOf(id: string): Promise<ClientRect> {
    // implemented workaround because following line doesn't work, because 'Error: An object could not be cloned.'
    //return await executeJsOnElement(id, "getBoundingClientRect()").catch(reason => util.logError(reason))

    let js = 'let rect = document.getElementById("' + id + '").getBoundingClientRect();'
    js += 'return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};' // manual copy because DOMRect could not be cloned

    // not executeJavaScript because of "UnhandledPromiseRejectionWarning: Unhandled promise rejection."
    const rect = await this.executeJavaScriptInFunction(js)

    return new ClientRect(rect.x, rect.y, rect.width, rect.height) // manual copy because object from renderer has no functions
  }

  public appendChildTo(parentId: string, childId: string): Promise<void> {
    // not executeJsOnElement because of "UnhandledPromiseRejectionWarning: Unhandled promise rejection."
    return this.executeJavaScriptInFunction('document.getElementById("' + parentId + '").appendChild(document.getElementById("' + childId + '"))')
  }

  public addContentTo(id: string, content: string): Promise<void> {
    let js = 'const temp = document.createElement("template");'
    js += 'temp.innerHTML = \''+content+'\';'
    js += 'document.getElementById("'+id+'").append(temp.content);'
    return this.executeJavaScriptSuppressingErrors(js)
  }

  public batch(batch: {elementId: string, method: BatchMethod, value: string}[]): Promise<void> {
    const commands: {elementId: string, jsToExecute: string}[] = batch.map(command => {
      switch (command.method) {
        case 'innerHTML':
        case 'style':
          return {elementId: command.elementId, jsToExecute: command.method+"='"+command.value+"'"}

        case 'addClassTo':
          return {elementId: command.elementId, jsToExecute: "classList.add('"+command.value+"')"}

        case 'removeClassFrom':
          return {elementId: command.elementId, jsToExecute: "classList.remove('"+command.value+"')"}
      }
    })
    return this.executeJsOnElementsSuppressingErrors(commands)
  }

  public setContentTo(id: string, content: string): Promise<void> {
    return this.executeJsOnElementSuppressingErrors(id, "innerHTML = '"+content+"'")
  }

  public remove(id: string): Promise<void> {
    return this.executeJsOnElementSuppressingErrors(id, "remove()")
  }

  public setStyleTo(id: string, style: string): Promise<void> {
    return this.executeJsOnElementSuppressingErrors(id, "style = '"+style+"'")
  }

  public addClassTo(id: string, className: string): Promise<void> {
    return this.executeJsOnElementSuppressingErrors(id, "classList.add('"+className+"')")
  }

  public removeClassFrom(id: string, className: string): Promise<void> {
    return this.executeJsOnElementSuppressingErrors(id, "classList.remove('"+className+"')")
  }

  public containsClass(id: string, className: string): Promise<boolean> {
    return this.executeJsOnElement(id, "classList.contains('"+className+"')")
  }

  public getClassesOf(id: string): Promise<string[]> {
    return this.executeJsOnElement(id, "classList")  // throws error: object could not be cloned
  }

  public getValueOf(id: string): Promise<string> {
    return this.executeJsOnElement(id, "value")
  }

  public setValueTo(id: string, value: string): Promise<void> {
    return this.executeJsOnElementSuppressingErrors(id, "value='"+value+"'")
  }

  public scrollToBottom(id: string): Promise<void> {
    return this.executeJsOnElementSuppressingErrors(id, "scrollTop = Number.MAX_SAFE_INTEGER")
  }

  public async addKeypressListenerTo(id: string, key: 'Enter', callback: (value: string) => void): Promise<void> {
    let ipcChannelName = 'keypress_'+id

    let rendererFunction: string = '(event) => {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'if (event.key === "'+key+'") {'
    rendererFunction += 'ipc.send("'+ipcChannelName+'", event.target.value);'
    rendererFunction += '}'
    rendererFunction += '}'

    await this.executeJavaScriptInFunction("document.getElementById('"+id+"').onkeypress = "+rendererFunction)

    this.addIpcChannelListener(ipcChannelName, (_: IpcMainEvent, value: string) => callback(value))
  }

  public async addWheelListenerTo(id: string, callback: (delta: number, clientX: number, clientY: number) => void): Promise<void> {
    let ipcChannelName = 'wheel_'+id

    let rendererFunction: string = '(event) => {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'ipc.send("'+ipcChannelName+'", event.deltaY, event.clientX, event.clientY);'
    rendererFunction += '}'

    await this.executeJavaScriptInFunction("document.getElementById('"+id+"').onwheel = "+rendererFunction)

    this.addIpcChannelListener(ipcChannelName, (_: IpcMainEvent, deltaY: number, clientX:number, clientY: number) => callback(deltaY, clientX, clientY))
  }

  public async addEventListenerTo(
    id: string,
    eventType: 'click'|'contextmenu'|'mouseover'|'mouseout'|'mousemove',
    callback: (clientX:number, clientY: number, ctrlPressed: boolean) => void
  ): Promise<void> {
    let ipcChannelName = eventType+'_'+id

    let rendererFunction: string = '(event) => {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'event.stopPropagation();'
    rendererFunction += 'ipc.send("'+ipcChannelName+'", event.clientX, event.clientY, event.ctrlKey);'
    rendererFunction += '}'

    await this.executeJavaScriptInFunction("document.getElementById('"+id+"').on"+eventType+" = "+rendererFunction)

    this.addIpcChannelListener(ipcChannelName, (_: IpcMainEvent, clientX: number, clientY: number, ctrlPressed: boolean) => callback(clientX, clientY, ctrlPressed))
  }

  public async addDragListenerTo(
    id: string,
    eventType: 'dragstart'|'drag'|'dragend'|'dragenter',
    callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void
  ): Promise<void> {
    let ipcChannelName = eventType+'_'+id

    let rendererFunction: string = '(event) => {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'event.stopPropagation();'
    rendererFunction += 'if (event.clientX != 0 || event.clientY != 0) {'
    rendererFunction += 'ipc.send("'+ipcChannelName+'", event.clientX, event.clientY, event.ctrlKey);'
    rendererFunction += '}'
    rendererFunction += '}'

    await this.executeJavaScriptInFunction("document.getElementById('"+id+"').on"+eventType+" = "+rendererFunction)

    this.addIpcChannelListener(ipcChannelName, (_: IpcMainEvent, clientX:number, clientY: number, ctrlPressed: boolean) => callback(clientX, clientY, ctrlPressed))
  }

  public async removeEventListenerFrom(
    id: string,
    eventType: 'click'|'contextmenu'|'mouseover'|'mouseout'|'mousemove'|'wheel'|'dragstart'|'drag'|'dragend'|'dragenter'
  ): Promise<void> {
    const ipcChannelName = eventType+'_'+id
    await this.executeJsOnElement(id, "on"+eventType+" = null")
    this.removeIpcChannelListener(ipcChannelName)
  }

  private addIpcChannelListener(channelName: string, listener: (event: IpcMainEvent, ...args: any[]) => void) {
    if (this.ipcChannels.includes(channelName) && !channelName.startsWith('mouseover')) { // TODO: also warn for mouseover asap
      util.logWarning('trying to add already included ipcChannel "'+channelName+'"')
    }
    ipcMain.on(channelName, listener)
    this.ipcChannels.push(channelName)
  }

  private removeIpcChannelListener(channelName: string) {
    if (!this.ipcChannels.includes(channelName)) {
      util.logWarning('trying to remove not included ipcChannel "'+channelName+'"')
    }
    ipcMain.removeAllListeners(channelName)
    this.ipcChannels.splice(this.ipcChannels.indexOf(channelName), 1)
  }

  public getIpcChannelsCount(): number {
    return this.ipcChannels.length
  }

  private executeJsOnElementsSuppressingErrors(commands: {elementId: string, jsToExecute: string}[]): Promise<void> {
    let jsBatch: string = ''
    commands.forEach(command => {
      jsBatch += "document.getElementById('"+command.elementId+"')."+command.jsToExecute+";"
    })
    return this.executeJavaScriptSuppressingErrors(jsBatch)
  }

  private executeJsOnElementSuppressingErrors(elementId: string, jsToExecute: string): Promise<void> {
    return this.executeJavaScriptSuppressingErrors("document.getElementById('"+elementId+"')."+jsToExecute)
  }

  private executeJsOnElement(elementId: string, jsToExecute: string): Promise<any> {
    return this.executeJavaScript("document.getElementById('"+elementId+"')."+jsToExecute)
  }

  public async executeJavaScriptSuppressingErrors(jsToExecute: string): Promise<void> { // public only for unit tests
    try {
      await this.executeJavaScript(jsToExecute)
    } catch(error) {
      util.logWarning(error.message)
    }
  }

  private executeJavaScriptInFunction(jsToExecute: string): Promise<any> {
    // () => {..} because otherwise "UnhandledPromiseRejectionWarning: Error: An object could not be cloned."
    let rendererCode = '(() => {'
    rendererCode += jsToExecute
    rendererCode += '}).call()'

    return this.executeJavaScript(rendererCode)
  }

  public async executeJavaScript(jsToExecute: string): Promise<any> { // public only for unit tests
    // otherwise render thread would crash when error occurs
    // TODO: does not work when jsToExecute destroys escaping and leads to invalid javascript
    const rendererCode = `try {
      ${jsToExecute}
    } catch(error) {
      error
    }`

    const result = await this.webContents.executeJavaScript(rendererCode)

    if (result instanceof Error) {
      let jsToExecuteEndings: string = jsToExecute
      if (jsToExecute.length > 256+10) {
        jsToExecuteEndings = jsToExecute.substring(0, 128)+'[.'+(jsToExecute.length-256)+'.]'+jsToExecute.substring(jsToExecute.length-128)
      }
      throw new Error('error in render thread occured: '+result.message+'. the javascript that was tried to execute was: '+jsToExecuteEndings)
    }

    return result
  }

}
