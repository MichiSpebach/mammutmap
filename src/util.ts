import { WebContents, ipcMain, IpcMainEvent } from 'electron'
import * as fs from 'fs'
import { Dirent } from 'fs'

var webContents: WebContents
var elementIdCounter: number

export function initUtil(webContentsToRender: WebContents) {
  webContents = webContentsToRender
  elementIdCounter = 0
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
  rendererFunction += 'console.log(event);'
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

export function setContentTo(id: string, content: string) {
  webContents.executeJavaScript("document.getElementById('" + id + "').innerHTML = '" + content + "'")
}

export function setStyleTo(id: string, style: string) {
  webContents.executeJavaScript("document.getElementById('" + id + "').style = '" + style + "'")
}

export function logInfo(message: string) {
    log('Info: ' + message, 'grey')
}

export function logError(message: string) {
    log('ERROR: ' + message, 'red')
}

function log(message: string, color: string): void {
  console.log(message)
  let division: string = '<div style="color:' + color + '">' + message + '</div>'
  webContents.executeJavaScript("document.getElementById('log').innerHTML = '" + division + "' + document.getElementById('log').innerHTML")
}

export function readdirSync(path: string): Dirent[] {
  return fs.readdirSync(path, { withFileTypes: true })
}

export function readFile(path: string, callback: (dataConvertedToHtml: string) => void): void {
  fs.readFile(path, 'utf-8', (err: NodeJS.ErrnoException | null, data: string) => {
    if(err) {
      logError('util::readFile, ' + path + ', ' + err.message)
    } else {
      callback(convertFileDataToHtmlString(data))
    }
  })
}

export function convertFileDataToHtmlString(fileData: string): string {
  var content: string = '';
  for (let i = 0; i < fileData.length-1; i++) {
    // TODO this is maybe very inefficient
    content += escapeCharForHtml(fileData[i])
  }
  return content
}

function escapeCharForHtml(c: string): string {
  switch (c) {
    case '\\':
      return '&#92;'
    case '\n':
      return '<br/>'
    case '\'':
      return '&#39;'
    case '"':
      return '&quot;'
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

export function generateElementId(): string {
  elementIdCounter += 1
  return 'element' + elementIdCounter
}
