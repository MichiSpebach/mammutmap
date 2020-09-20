import { WebContents } from 'electron'
import * as fs from 'fs'
import { Dirent } from 'fs'

var webContents: WebContents
var divIdCounter: number

export function initUtil(webContentsToRender: WebContents) {
  webContents = webContentsToRender
  divIdCounter = 0
}

export function addContent(content: string): void {
  webContents.executeJavaScript("document.getElementById('content').innerHTML += '" + content + "'")
}

export function setContent(content: string): void {
  webContents.executeJavaScript("document.getElementById('content').innerHTML = '" + content + "'")
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
  webContents.executeJavaScript("document.getElementById('log').innerHTML += '" + division + "'")
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

export function generateDivId(): string {
  divIdCounter += 1
  return 'division' + divIdCounter
}
