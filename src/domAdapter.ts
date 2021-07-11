import { BrowserWindow, WebContents, Point, Rectangle, screen, ipcMain, IpcMainEvent } from 'electron'
import { Rect } from './Rect'

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
  private definedRendererFunctions: Set<string> = new Set<string>()

  public constructor(windowToRenderIn: BrowserWindow) {
    this.renderWindow = windowToRenderIn
    this.webContents = this.renderWindow.webContents
    // TODO: define 'let ipc = require("electron").ipcRenderer;' in renderer only once
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

  public async getClientRectOf(id: string): Promise<Rect> {
    // implemented workaround because following line doesn't work, because 'Error: An object could not be cloned.'
    //return await executeJsOnElement(id, "getBoundingClientRect()").catch(reason => util.logError(reason))

    let js = 'let rect = document.getElementById("' + id + '").getBoundingClientRect();'
    js += 'return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};' // manual copy because DOMRect could not be cloned

    const rect = await this.executeJavaScript(js)

    return new Rect(rect.x, rect.y, rect.width, rect.height) // manual copy because object from renderer has no functions
  }

  public appendChildTo(parentId: string, childId: string): Promise<void> {
    // not executeJsOnElement because of "UnhandledPromiseRejectionWarning: Unhandled promise rejection."
    return this.executeJavaScript('document.getElementById("' + parentId + '").appendChild(document.getElementById("' + childId + '"))')
  }

  public addContentTo(id: string, content: string): Promise<void> {
    let js = 'const temp = document.createElement("template");'
    js += 'temp.innerHTML = \'' + content + '\';'
    js += 'document.getElementById("' + id + '").append(temp.content);'

    return this.executeJavaScript(js)
  }

  public setContentTo(id: string, content: string): Promise<void> {
    return this.executeJsOnElement(id, "innerHTML = '" + content + "'")
  }

  public setStyleTo(id: string, style: string): Promise<void> {
    return this.executeJsOnElement(id, "style = '" + style + "'")
  }

  public addClassTo(id: string, className: string): Promise<void> {
    return this.executeJsOnElement(id, "classList.add('" + className + "')")
  }

  public removeClassFrom(id: string, className: string): Promise<void> {
    return this.executeJsOnElement(id, "classList.remove('" + className + "')")
  }

  public containsClass(id: string, className: string): Promise<boolean> {
    return this.executeJsOnElement(id, "classList.contains('" + className + "')")
  }

  public getClassesOf(id: string): Promise<string[]> {
    return this.executeJsOnElement(id, "classList")  // throws error: object could not be cloned
  }

  public scrollToBottom(id: string): void {
    this.executeJsOnElement(id, "scrollTop = Number.MAX_SAFE_INTEGER")
  }

  public addWheelListenerTo(id: string, callback: (delta: number, clientX: number, clientY: number) => void): void {
    let ipcChannelName = 'wheel_' + id

    var rendererFunction: string = '(event) => {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'ipc.send("' + ipcChannelName + '", event.deltaY, event.clientX, event.clientY);'
    rendererFunction += '}'

    this.executeJsOnElement(id, "addEventListener('wheel', " + rendererFunction + ")")

    ipcMain.on(ipcChannelName, (_: IpcMainEvent, deltaY: number, clientX:number, clientY: number) => callback(deltaY, clientX, clientY))
  }

  public addEventListenerTo(
    id: string,
    eventType: 'click'|'contextmenu'|'mouseover'|'mouseout'|'mousemove',
    callback: (clientX:number, clientY: number) => void
  ): void {
    let ipcChannelName = eventType+'_'+id

    var rendererFunction: string = '(event) => {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'event.stopPropagation();'
    rendererFunction += 'ipc.send("' + ipcChannelName + '", event.clientX, event.clientY);'
    rendererFunction += '}'

    this.executeJsOnElement(id, "addEventListener('"+eventType+"', "+rendererFunction+")")

    ipcMain.on(ipcChannelName, (_: IpcMainEvent, clientX: number, clientY: number) => callback(clientX, clientY))
  }

  // TODO: fuse with addEventListenerTo?
  public async addRemovableEventListenerTo(
    id: string,
    eventType: 'click'|'contextmenu'|'mouseover'|'mouseout'|'mousemove',
    callback: (clientX:number, clientY: number) => void
  ): Promise<void> {
    const listenerFunctionName = eventType+'_'+id
    const ipcChannelName = eventType+'_'+id

    if (!this.definedRendererFunctions.has(listenerFunctionName)) {
      let rendererFunction: string = 'function '+listenerFunctionName+'(event) {'
      rendererFunction += 'let ipc = require("electron").ipcRenderer;'
      //rendererFunction += 'console.log(event);'
      rendererFunction += 'event.stopPropagation();'
      rendererFunction += 'ipc.send("' + ipcChannelName + '", event.clientX, event.clientY);'
      rendererFunction += '}'
      await this.defineRendererFunction(listenerFunctionName, rendererFunction)
    }

    await this.executeJsOnElement(id, "addEventListener('"+eventType+"', "+listenerFunctionName+")")

    ipcMain.on(ipcChannelName, (_: IpcMainEvent, clientX: number, clientY: number) => callback(clientX, clientY))
  }

  public removeEventListenerFrom(
    id: string,
    eventType: 'click'|'contextmenu'|'mouseover'|'mouseout'|'mousemove'
  ): void {
    const listenerFunctionName = eventType+'_'+id
    const ipcChannelName = eventType+'_'+id
    this.executeJsOnElement(id, "removeEventListener('"+eventType+"', "+listenerFunctionName+")")
    ipcMain.removeAllListeners(ipcChannelName)
  }

  public addDragListenerTo(
    id: string,
    eventType: 'dragstart'|'drag'|'dragend'|'dragenter',
    callback: (clientX: number, clientY: number) => void
  ): void {
    let ipcChannelName = eventType + '_' + id

    var rendererFunction: string = '(event) => {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'event.stopPropagation();'
    rendererFunction += 'if (event.clientX != 0 || event.clientY != 0) {'
    rendererFunction += 'ipc.send("' + ipcChannelName + '", event.clientX, event.clientY);'
    rendererFunction += '}'
    rendererFunction += '}'

    this.executeJsOnElement(id, "addEventListener('" + eventType + "', " + rendererFunction + ")")

    ipcMain.on(ipcChannelName, (_: IpcMainEvent, clientX:number, clientY: number) => callback(clientX, clientY))
  }

  private executeJsOnElement(elementId: string, jsToExecute: string): Promise<any> {
    return this.webContents.executeJavaScript("document.getElementById('" + elementId + "')." + jsToExecute)
  }

  private executeJavaScript(jsToExecute: string): Promise<any> {
    // () => {..} because otherwise "UnhandledPromiseRejectionWarning: Error: An object could not be cloned."
    let rendererCode = '(() => {'
    rendererCode += jsToExecute
    rendererCode += '}).call()'

    return this.webContents.executeJavaScript(rendererCode)
  }

  private defineRendererFunction(name: string, rendererCode: string): Promise<void> {
    this.definedRendererFunctions.add(name)
    return this.webContents.executeJavaScript(rendererCode)
  }

}
