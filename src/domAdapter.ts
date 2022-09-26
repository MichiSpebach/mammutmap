import { util } from './util'
import { RenderElement } from './util/RenderElement'
import { BrowserWindow, WebContents, Point, Rectangle, screen, ipcMain, IpcMainEvent } from 'electron'
import { ClientRect } from './ClientRect'

export type MouseEventType = 'click'|'contextmenu'|'mousedown'|'mouseup'|'mousemove'|'mouseover'|'mouseout'|'mouseenter'|'mouseleave'
export type DragEventType = 'dragstart'|'drag'|'dragend'|'dragenter'
export type WheelEventType = 'wheel'
export type InputEventType = 'change'
type EventType = MouseEventType|DragEventType|WheelEventType|InputEventType

export type MouseEventResultAdvanced = {
  clientX: number,
  clientY: number,
  ctrlPressed: boolean,
  cursor: 'auto'|'default'|'pointer'|'grab'|'ns-resize'|'ew-resize'|'nwse-resize'
}

export type BatchMethod = 'setElementTo'|'innerHTML'|'style'|'addClassTo'|'removeClassFrom'

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
  private eventChannelIdDictionary: Map<string, {event: EventType, callback: () => void}[]> = new Map()

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

  public batch(batch: {elementId: string, method: BatchMethod, value: string|RenderElement}[]): Promise<void> {
    const jsCommands: string[] = batch.map(command => {
      switch (command.method) {
        case 'setElementTo':
          return this.createSetElementJavaScriptAndAddIpcChannelListeners(command.elementId, command.value as RenderElement)

        case 'innerHTML':
        case 'style':
          return `document.getElementById('${command.elementId}').${command.method}='${command.value}';`

        case 'addClassTo':
          return `document.getElementById('${command.elementId}').classList.add('${command.value}');`

        case 'removeClassFrom':
          return `document.getElementById('${command.elementId}').classList.remove('${command.value}');`
      }
    })

    return this.executeJavaScript(jsCommands.join(''))
  }

  public appendChildTo(parentId: string, childId: string): Promise<void> {
    return this.executeJavaScript(`document.getElementById("${parentId}").append(document.getElementById("${childId}"))`)
  }

  public addContentTo(id: string, content: string): Promise<void> {
    let js = 'const temp = document.createElement("template");'
    js += 'temp.innerHTML = \''+content+'\';'
    js += 'document.getElementById("'+id+'").append(temp.content);'
    return this.executeJavaScriptSuppressingErrors(js)
  }

  public addElementTo(id: string, element: RenderElement): Promise<void> {
    let js: string = this.createHtmlElementJavaScriptOf(element)
    js += `document.getElementById("${id}").append(element);`
    return this.executeJavaScript(js)
  }

  public setElementTo(id: string, element: RenderElement): Promise<void> {
    return this.executeJavaScript(this.createSetElementJavaScriptAndAddIpcChannelListeners(id, element))
  }

  private createSetElementJavaScriptAndAddIpcChannelListeners(id: string, element: RenderElement): string {
    let js: string = this.createHtmlElementJavaScriptOf(element)
    js += `document.getElementById("${id}").innerHTML="";`
    js += `document.getElementById("${id}").append(element);` // TODO: is there no set(element) method?
    return js
  }

  private createHtmlElementJavaScriptOf(element: RenderElement): string {
    // TODO: find way to pass object directly to renderer thread and merge attributes into domElement
    let js = `const element = document.createElement("${element.type}");`

    // TODO: work in progress: parse element.children and add them

    for (const attribute in element.attributes) {
      if (attribute === 'onclick') { // TODO: handle all events
        let ipcChannelName = 'click_'
        if (!element.attributes.id) {
          util.logWarning('Element has onclick set but no id.')
          ipcChannelName += util.generateId()
        } else {
          ipcChannelName += element.attributes.id
        }
        js += `element.${attribute}=${this.createMouseEventRendererFunction(ipcChannelName)};`
        this.addMouseEventChannelListener(ipcChannelName, element.attributes[attribute])
      } else {
        js += `element.${attribute}="${element.attributes[attribute]}";`
      }
    }

    return js
  }

  public setContentTo(id: string, content: string): Promise<void> {
    return this.executeJsOnElementSuppressingErrors(id, "innerHTML = '"+content+"'")
  }

  // TODO: add to renderManager
  public clear(id: string): Promise<void> {
    return this.executeJsOnElementSuppressingErrors(id, "innerHTML=''")
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

  public async modifyCssRule(cssRuleName: string, propertyName: string, propertyValue: string): Promise<{propertyValueBefore: string}> {
    let jsToExecute: string = `let styleSheet = document.styleSheets[0]
    for (const rule of styleSheet.rules) {
      if (rule.selectorText === "${cssRuleName}") {
        const propertyValueBefore = rule.style.${propertyName}
        rule.style.${propertyName} = "${propertyValue}"
        return propertyValueBefore
      }
    }
    throw new Error("CssRule with name '${cssRuleName}' not found.")`

    return {propertyValueBefore: await this.executeJavaScriptInFunction(jsToExecute)}
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

  public async addChangeListenerTo<RETURN_TYPE>(
    id: string,
    returnField: 'value'|'checked',
    callback: (value: RETURN_TYPE) => void
  ): Promise<void> {
    let ipcChannelName = 'change_'+id

    let rendererFunction: string = '(event) => {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'ipc.send("'+ipcChannelName+'", event.target.'+returnField+');'
    rendererFunction += '}'

    await this.executeJavaScriptInFunction("document.getElementById('"+id+"').onchange = "+rendererFunction)

    this.addIpcChannelListener(ipcChannelName, (_: IpcMainEvent, value: RETURN_TYPE) => callback(value))
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

  public async addEventListenerAdvancedTo(
    id: string,
    eventType: MouseEventType,
    callback: (result: MouseEventResultAdvanced) => void
  ): Promise<void> {
    let ipcChannelName = eventType+'_'+id

    let rendererFunction: string = '(event) => {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'event.stopPropagation();'
    rendererFunction += 'let cursor = window.getComputedStyle(event.target)["cursor"];'
    rendererFunction += 'ipc.send("'+ipcChannelName+'", event.clientX, event.clientY, event.ctrlKey, cursor);'
    rendererFunction += '}'

    await this.executeJavaScriptInFunction("document.getElementById('"+id+"').on"+eventType+" = "+rendererFunction)

    this.addIpcChannelListener(
      ipcChannelName,
      (_: IpcMainEvent, clientX: number, clientY: number, ctrlPressed: boolean, cursor: any) => callback({clientX, clientY, ctrlPressed, cursor})
    )
  }

  public async addEventListenerTo(
    id: string,
    eventType: MouseEventType,
    callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void
  ): Promise<void> {
    const ipcChannelName = eventType+'_'+id
    const rendererFunction: string = this.createMouseEventRendererFunction(ipcChannelName)
    await this.executeJavaScriptInFunction("document.getElementById('"+id+"').on"+eventType+" = "+rendererFunction)
    this.addMouseEventChannelListener(ipcChannelName, callback)
  }

  private createMouseEventRendererFunction(ipcChannelName: string): string {
    let rendererFunction: string = '(event) => {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'event.stopPropagation();'
    rendererFunction += 'ipc.send("'+ipcChannelName+'", event.clientX, event.clientY, event.ctrlKey);'
    rendererFunction += '}'
    return rendererFunction
  }

  private addMouseEventChannelListener(
    ipcChannelName: string,
    callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void
  ): void {
    this.addIpcChannelListener(ipcChannelName, (_: IpcMainEvent, clientX: number, clientY: number, ctrlPressed: boolean) => callback(clientX, clientY, ctrlPressed))
  }

  public async addDragListenerTo(
    id: string,
    eventType: DragEventType,
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

  public async removeEventListenerFrom(id: string, eventType: MouseEventType|DragEventType|WheelEventType|InputEventType): Promise<void> {
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

  private executeJsOnElementSuppressingErrors(elementId: string, jsToExecute: string): Promise<void> {
    return this.executeJavaScriptSuppressingErrors("document.getElementById('"+elementId+"')."+jsToExecute)
  }

  private executeJsOnElement(elementId: string, jsToExecute: string): Promise<any> {
    return this.executeJavaScript("document.getElementById('"+elementId+"')."+jsToExecute)
  }

  public async executeJavaScriptSuppressingErrors(jsToExecute: string): Promise<void> { // public only for unit tests
    try {
      await this.executeJavaScript(jsToExecute)
    } catch(error: any) {
      // TODO this should never happen anymore, remove as soon as save
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
      util.logWarning('error in render thread occured: '+result.message+'. the javascript that was tried to execute was: '+jsToExecuteEndings)
    }

    return result
  }

}
