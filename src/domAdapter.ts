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

  return await webContents.executeJavaScript(rendererCode)
}

export async function getSizeOf(id: string): Promise<{width: number; height: number}> {
  let widthPromise: Promise<number> = getWidthOf(id)
  let heightPromise: Promise<number> = getHeightOf(id)
  let width: number = await widthPromise
  let height: number = await heightPromise
  return {width, height}
}

export function getWidthOf(id: string): Promise<number> {
  return executeJsOnElement(id, "offsetWidth")
}

export function getHeightOf(id: string): Promise<number> {
  return executeJsOnElement(id, "offsetHeight")
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

export function addDragListenerTo(id: string, eventType: 'dragstart'|'drag', callback: (clientX: number, clientY: number) => void): void {
  let ipcChannelName = eventType + '_' + id

  var rendererFunction: string = '(event) => {'
  rendererFunction += 'let ipc = require("electron").ipcRenderer;'
  rendererFunction += 'console.log(event);'
  rendererFunction += 'if (event.clientX != 0 || event.clientY != 0) {'
  rendererFunction += 'ipc.send("' + ipcChannelName + '", event.clientX, event.clientY);'
  rendererFunction += '}'
  rendererFunction += '}'

  executeJsOnElement(id, "addEventListener('" + eventType + "', " + rendererFunction + ")")

  ipcMain.on(ipcChannelName, (_: IpcMainEvent, clientX:number, clientY: number) => callback(clientX, clientY))
}

function executeJsOnElement(elementId: string, jsToExectue: string): Promise<any> {
  return webContents.executeJavaScript("document.getElementById('" + elementId + "')." + jsToExectue)
}
