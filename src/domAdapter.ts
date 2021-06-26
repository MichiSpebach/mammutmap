import { BrowserWindow, WebContents, Point, Rectangle, screen, ipcMain, IpcMainEvent } from 'electron'
import { Rect } from './Rect'

let renderWindow: BrowserWindow
let webContents: WebContents
const definedRendererFunctions: Set<string> = new Set<string>()

export function init(windowToRenderIn: BrowserWindow) {
  renderWindow = windowToRenderIn
  webContents = renderWindow.webContents
  // TODO: define 'let ipc = require("electron").ipcRenderer;' in renderer only once
}

export function getClientSize(): {width: number, height: number} {
  const size: number[] = renderWindow.getContentSize()
  return {width: size[0], height: size[1]}
}

export function getCursorClientPosition(): {x: number, y: number} {
  const cursorScreenPosition: Point = screen.getCursorScreenPoint()
  const contentBounds: Rectangle = renderWindow.getContentBounds()

  return {x: cursorScreenPosition.x - contentBounds.x, y: cursorScreenPosition.y - contentBounds.y}
}

export async function getClientRectOf(id: string): Promise<Rect> {
  // implemented workaround because following line doesn't work, because 'Error: An object could not be cloned.'
  //return await executeJsOnElement(id, "getBoundingClientRect()").catch(reason => util.logError(reason))

  let js = 'let rect = document.getElementById("' + id + '").getBoundingClientRect();'
  js += 'return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};' // manual copy because DOMRect could not be cloned

  const rect = await executeJavaScript(js)

  return new Rect(rect.x, rect.y, rect.width, rect.height) // manual copy because object from renderer has no functions
}

export function appendChildTo(parentId: string, childId: string): Promise<void> {
  // not executeJsOnElement because of "UnhandledPromiseRejectionWarning: Unhandled promise rejection."
  return executeJavaScript('document.getElementById("' + parentId + '").appendChild(document.getElementById("' + childId + '"))')
}

export function addContentTo(id: string, content: string): Promise<void> {
  let js = 'const temp = document.createElement("template");'
  js += 'temp.innerHTML = \'' + content + '\';'
  js += 'document.getElementById("' + id + '").append(temp.content);'

  return executeJavaScript(js)
}

export function setContentTo(id: string, content: string): Promise<void> {
  return executeJsOnElement(id, "innerHTML = '" + content + "'")
}

export function setStyleTo(id: string, style: string): Promise<void> {
  return executeJsOnElement(id, "style = '" + style + "'")
}

export function addClassTo(id: string, className: string): Promise<void> {
  return executeJsOnElement(id, "classList.add('" + className + "')")
}

export function removeClassFrom(id: string, className: string): Promise<void> {
  return executeJsOnElement(id, "classList.remove('" + className + "')")
}

export function containsClass(id: string, className: string): Promise<boolean> {
  return executeJsOnElement(id, "classList.contains('" + className + "')")
}

export function getClassesOf(id: string): Promise<string[]> {
  return executeJsOnElement(id, "classList")  // throws error: object could not be cloned
}

export function scrollToBottom(id: string): void {
  executeJsOnElement(id, "scrollTop = Number.MAX_SAFE_INTEGER")
}

export function addWheelListenerTo(id: string, callback: (delta: number, clientX: number, clientY: number) => void): void {
  let ipcChannelName = 'wheel_' + id

  var rendererFunction: string = '(event) => {'
  rendererFunction += 'let ipc = require("electron").ipcRenderer;'
  //rendererFunction += 'console.log(event);'
  rendererFunction += 'ipc.send("' + ipcChannelName + '", event.deltaY, event.clientX, event.clientY);'
  rendererFunction += '}'

  executeJsOnElement(id, "addEventListener('wheel', " + rendererFunction + ")")

  ipcMain.on(ipcChannelName, (_: IpcMainEvent, deltaY: number, clientX:number, clientY: number) => callback(deltaY, clientX, clientY))
}

export function addEventListenerTo(
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

  executeJsOnElement(id, "addEventListener('"+eventType+"', "+rendererFunction+")")

  ipcMain.on(ipcChannelName, (_: IpcMainEvent, clientX: number, clientY: number) => callback(clientX, clientY))
}

// TODO: fuse with addEventListenerTo?
export async function addRemovableEventListenerTo(
  id: string,
  eventType: 'click'|'contextmenu'|'mouseover'|'mouseout'|'mousemove',
  callback: (clientX:number, clientY: number) => void
): Promise<void> {
  const listenerFunctionName = eventType+'_'+id
  const ipcChannelName = eventType+'_'+id

  if (!definedRendererFunctions.has(listenerFunctionName)) {
    let rendererFunction: string = 'function '+listenerFunctionName+'(event) {'
    rendererFunction += 'let ipc = require("electron").ipcRenderer;'
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'event.stopPropagation();'
    rendererFunction += 'ipc.send("' + ipcChannelName + '", event.clientX, event.clientY);'
    rendererFunction += '}'
    await defineRendererFunction(listenerFunctionName, rendererFunction)
  }

  await executeJsOnElement(id, "addEventListener('"+eventType+"', "+listenerFunctionName+")")

  ipcMain.on(ipcChannelName, (_: IpcMainEvent, clientX: number, clientY: number) => callback(clientX, clientY))
}

export function removeEventListenerFrom(
  id: string,
  eventType: 'click'|'contextmenu'|'mouseover'|'mouseout'|'mousemove'
): void {
  const listenerFunctionName = eventType+'_'+id
  const ipcChannelName = eventType+'_'+id
  executeJsOnElement(id, "removeEventListener('"+eventType+"', "+listenerFunctionName+")")
  ipcMain.removeAllListeners(ipcChannelName)
}

export function addDragListenerTo(
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

  executeJsOnElement(id, "addEventListener('" + eventType + "', " + rendererFunction + ")")

  ipcMain.on(ipcChannelName, (_: IpcMainEvent, clientX:number, clientY: number) => callback(clientX, clientY))
}

function executeJsOnElement(elementId: string, jsToExecute: string): Promise<any> {
  return webContents.executeJavaScript("document.getElementById('" + elementId + "')." + jsToExecute)
}

function executeJavaScript(jsToExecute: string): Promise<any> {
  // () => {..} because otherwise "UnhandledPromiseRejectionWarning: Error: An object could not be cloned."
  let rendererCode = '(() => {'
  rendererCode += jsToExecute
  rendererCode += '}).call()'

  return webContents.executeJavaScript(rendererCode)
}

function defineRendererFunction(name: string, rendererCode: string): Promise<void> {
  definedRendererFunctions.add(name)
  return webContents.executeJavaScript(rendererCode)
}
