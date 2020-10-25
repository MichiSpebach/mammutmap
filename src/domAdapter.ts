import { WebContents, ipcMain, IpcMainEvent } from 'electron'

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

export async function getClientRectOf(id: string): Promise<DOMRect> {
  // doesn't work, maybe object cannot be transferred from render thread
  return webContents.executeJavaScript("document.getElementById('" + id + "').getBoundingClientRect()")
}

export async function getSizeOf(id: string): Promise<{width: number; height: number} > {
  let widthPromise: Promise<number> = getWidthOf(id)
  let heightPromise: Promise<number> = getHeightOf(id)
  let width: number = await widthPromise
  let height: number = await heightPromise
  return {width, height}
}

export function getWidthOf(id: string): Promise<number> {
  return webContents.executeJavaScript("document.getElementById('" + id + "').offsetWidth")
}

export function getHeightOf(id: string): Promise<number> {
  return webContents.executeJavaScript("document.getElementById('" + id + "').offsetHeight")
}

export function addWheelListenerTo(id: string, callback: (delta: number, clientX: number, clientY: number) => void): void {
  let ipcChannelName = 'wheel' + id

  var rendererFunction: string = '(event) => {'
  rendererFunction += 'let ipc = require("electron").ipcRenderer;'
  //rendererFunction += 'console.log(event);'
  rendererFunction += 'ipc.send("' + ipcChannelName + '", event.deltaY, event.clientX, event.clientY);'
  rendererFunction += '}'

  webContents.executeJavaScript("document.getElementById('" + id + "').addEventListener('wheel', " + rendererFunction + ")")

  ipcMain.on(ipcChannelName, (_: IpcMainEvent, deltaY: number, clientX:number, clientY: number) => callback(deltaY, clientX, clientY))
}

export function addContent(content: string): void {
  webContents.executeJavaScript("document.getElementById('content').innerHTML += '" + content + "'")
}

export function setContent(content: string): void {
  webContents.executeJavaScript("document.getElementById('content').innerHTML = '" + content + "'")
}

export function addContentTo(id: string, content: string) {
  webContents.executeJavaScript("document.getElementById('" + id + "').innerHTML += '" + content + "'")
}

export function insertContentTo(id: string, content: string): void {
  webContents.executeJavaScript("document.getElementById('" + id + "').innerHTML = '" + content + "' + document.getElementById('" + id + "').innerHTML")
}

export function setContentTo(id: string, content: string) {
  webContents.executeJavaScript("document.getElementById('" + id + "').innerHTML = '" + content + "'")
}

export function setStyleTo(id: string, style: string) {
  webContents.executeJavaScript("document.getElementById('" + id + "').style = '" + style + "'")
}
