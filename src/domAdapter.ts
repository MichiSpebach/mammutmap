import { WebContents, ipcMain, IpcMainEvent } from 'electron'
import * as util from './util'
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

  let ipcChannelName = 'getClientRectOf_' + id

  var rendererCode = '{'
  rendererCode += 'let ipc = require("electron").ipcRenderer;'
  rendererCode += 'let rect = document.getElementById("' + id + '").getBoundingClientRect();'
  rendererCode += 'ipc.send("' + ipcChannelName + '", {x: rect.x, y: rect.y, width: rect.width, height: rect.height});' // manual copy because DOMRect could not be cloned
  rendererCode += '}'

  webContents.executeJavaScript(rendererCode)

  return new Promise<Rect>(resolve => {
    ipcMain.once(ipcChannelName, (_: IpcMainEvent, rect) => resolve(rect))
  })
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

export function addContent(content: string): void {
  addContentTo('content', content)
}

export function setContent(content: string): void {
  setContentTo('content', content)
}

export function addContentTo(id: string, content: string): void {
  executeJsOnElement(id, "innerHTML += '" + content + "'")
}

export function insertContentTo(id: string, content: string): void {
  executeJsOnElement(id, "innerHTML = '" + content + "' + document.getElementById('" + id + "').innerHTML")
}

export function setContentTo(id: string, content: string): void {
  executeJsOnElement(id, "innerHTML = '" + content + "'")
}

export function setStyleTo(id: string, style: string): void {
  executeJsOnElement(id, "style = '" + style + "'")
}

export function addWheelListenerTo(id: string, callback: (delta: number, clientX: number, clientY: number) => void): void {
  let ipcChannelName = 'wheel' + id

  var rendererFunction: string = '(event) => {'
  rendererFunction += 'let ipc = require("electron").ipcRenderer;'
  //rendererFunction += 'console.log(event);'
  rendererFunction += 'ipc.send("' + ipcChannelName + '", event.deltaY, event.clientX, event.clientY);'
  rendererFunction += '}'

  executeJsOnElement(id, "addEventListener('wheel', " + rendererFunction + ")")

  ipcMain.on(ipcChannelName, (_: IpcMainEvent, deltaY: number, clientX:number, clientY: number) => callback(deltaY, clientX, clientY))
}

export function addDragListenerTo(id: string): void {
  var rendererFunction: string = '(event) => {'
  rendererFunction += 'console.log(event);'
  rendererFunction += '}'

  executeJsOnElement(id, "addEventListener('dragstart', " + rendererFunction + ")")
}

function executeJsOnElement(elementId: string, jsToExectue: string): Promise<any> {
  return webContents.executeJavaScript("document.getElementById('" + elementId + "')." + jsToExectue)
}
