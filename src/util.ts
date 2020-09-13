import { WebContents } from 'electron';

var webContents: WebContents

export function initUtil(webContentsToRender: WebContents) {
  webContents = webContentsToRender
}

export function addContent(content: string): void {
  webContents.executeJavaScript("document.getElementById('content').innerHTML += '" + content + "'")
}

export function setContent(content: string): void {
  webContents.executeJavaScript("document.getElementById('content').innerHTML = '" + content + "'")
}

export function log(log: string): void {
  console.log(log)
  webContents.executeJavaScript("document.getElementById('log').innerHTML += '<br/>" + log + "'")
}
