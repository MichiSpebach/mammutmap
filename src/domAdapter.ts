import { WebContents, ipcMain, IpcMainEvent } from 'electron'
import { Rect } from './Rect'

var webContents: WebContents

export function init(webContentsToRender: WebContents) {
  webContents = webContentsToRender
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

export function addClickListenerTo(id: string, callback: () => void): void {
  let ipcChannelName = 'click_' + id

  var rendererFunction: string = '(event) => {'
  rendererFunction += 'let ipc = require("electron").ipcRenderer;'
  //rendererFunction += 'console.log(event);'
  rendererFunction += 'ipc.send("' + ipcChannelName + '");'
  rendererFunction += '}'

  executeJsOnElement(id, "addEventListener('click', " + rendererFunction + ")")

  ipcMain.on(ipcChannelName, (_: IpcMainEvent) => callback())
}

export function addDragListenerTo(
    id: string,
    eventType: 'dragstart'|'drag'|'dragend'|'dragenter',
    callback: (clientX: number, clientY: number) => void
  ): void {
  let ipcChannelName = eventType + '_' + id

  var rendererFunction: string = '(event) => {'
  rendererFunction += 'let ipc = require("electron").ipcRenderer;'
//  rendererFunction += 'console.log(event);'
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
