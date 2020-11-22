import { WebContents, ipcMain, IpcMainEvent } from 'electron'
import { Rect } from './Rect'

var webContents: WebContents
var elementIdCounter: number

export function init(webContentsToRender: WebContents) {
  webContents = webContentsToRender
  elementIdCounter = 0
}

export function generateElementId(): string {
  elementIdCounter += 1
  return 'element' + elementIdCounter
}

export async function getClientRectOf(id: string): Promise<Rect> {
  // implemented workaround because following line doesn't work, because 'Error: An object could not be cloned.'
  //return await executeJsOnElement(id, "getBoundingClientRect()").catch(reason => util.logError(reason))

  var rendererCode = '(() => {'
  rendererCode += 'let rect = document.getElementById("' + id + '").getBoundingClientRect();'
  rendererCode += 'return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};' // manual copy because DOMRect could not be cloned
  rendererCode += '}).call()'

  let rect = await webContents.executeJavaScript(rendererCode)
  return new Rect(rect.x, rect.y, rect.width, rect.height) // manual copy because object from renderer has no functions
}

export function appendChildTo(parentId: string, childId: string): Promise<void> {
  // otherwise "UnhandledPromiseRejectionWarning: Error: An object could not be cloned."
  var rendererCode = '(() => {'
  rendererCode += 'document.getElementById("' + parentId + '").appendChild(document.getElementById("' + childId + '"))'
  rendererCode += '}).call()'

  return webContents.executeJavaScript(rendererCode)
}

export function addContentTo(id: string, content: string): Promise<void> {
  return executeJsOnElement(id, "innerHTML += '" + content + "'")
}

export function setContentTo(id: string, content: string): Promise<void> {
  return executeJsOnElement(id, "innerHTML = '" + content + "'")
}

export function setStyleTo(id: string, style: string): Promise<void> {
  return executeJsOnElement(id, "style = '" + style + "'")
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

export function addDragListenerTo(id: string, eventType: 'dragstart'|'drag'|'dragend', callback: (clientX: number, clientY: number) => void): void {
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

export function addDragEnterListenerTo(id: string, eventType: 'dragenter'|'dragover'|'dragleave', elementToIgnoreId: string, callback: () => void): void {
  let ipcChannelName = eventType + '_' + id

  var rendererFunction: string = '(event) => {'
  rendererFunction += 'let ipc = require("electron").ipcRenderer;'
  rendererFunction += 'console.log(event);'
  //rendererFunction += 'console.log(event.target.id + " " + "' + elementToIgnoreId + '");'
  //rendererFunction += 'if (event.target.id != "' + elementToIgnoreId + '") {'
  rendererFunction += 'event.stopPropagation();'
  rendererFunction += 'ipc.send("' + ipcChannelName + '");'
  //rendererFunction += '}'
  rendererFunction += '}'

  executeJsOnElement(id, "addEventListener('" + eventType + "', " + rendererFunction + ")")

  ipcMain.on(ipcChannelName, (_: IpcMainEvent) => callback())
}

function executeJsOnElement(elementId: string, jsToExectue: string): Promise<any> {
  return webContents.executeJavaScript("document.getElementById('" + elementId + "')." + jsToExectue)
}
