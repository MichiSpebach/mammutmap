import { exec } from 'child_process'
import * as dom from './domAdapter'

export function runShellCommand(command: string) {
  exec(command)
}

export function logInfo(message: string): void {
    log('Info: ' + message, 'grey', 'log')
}

export function logWarning(message: string): void {
    log('WARNING: ' + message, 'orange', 'trace')
}

export function logError(message: string): never {
    log('ERROR: ' + message, 'red', 'trace')
    throw new Error(message)
}

async function log(message: string, color: string, mode: 'log'|'trace'): Promise<void> {
  if (mode === 'log') {
    console.log(message)
  } else {
    console.trace(message)
  }

  const division: string = '<div style="color:' + color + '">' + escapeForHtml(message) + '</div>'
  await dom.addContentTo('log', division)
  dom.scrollToBottom('log')
}

export function stringify(object: any): string {
  var stringifiedObject: string = object + ': '
  for (var key in object) {
    //if(typeof rect[key] !== 'function') {
      stringifiedObject += key + '=' + object[key] + '; '
    //}
  }
  return stringifiedObject
}

export function escapeForHtml(text: string): string {
  var content: string = '';
  for (let i = 0; i < text.length; i++) {
    // TODO this is maybe very inefficient
    content += escapeCharForHtml(text[i])
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

export function toFormattedJson(object: any) {
  return JSON.stringify(object, null, '\t')
}

export function wait(milliSeconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliSeconds))
}

export function generateId(): string {
  return Math.random().toString(32).substring(2)
}
