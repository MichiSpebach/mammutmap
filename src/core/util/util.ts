import { environment, ChildProcess } from '../environmentAdapter'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import * as indexHtmlIds from '../indexHtmlIds'
import { RenderElement, Style } from './RenderElement'
import * as stacktraceUtil from './stacktraceUtil'
import { log } from '../logService'

class Util {
  public readonly githubProjectAddress: string = 'https://github.com/MichiSpebach/mammutmap'
  public readonly pluginTutorialAddress: string = this.githubProjectAddress+'/blob/main/pluginTutorial.md'
  public readonly vscodeMarketplaceAddress: string = 'https://marketplace.visualstudio.com/items?itemName=mammutmap.mammutmap'

  public runShellCommand(command: string): ChildProcess {
    return environment.runShellCommand(command)
  }

  /** @deprecated use log.debug(..) instead */
  public logDebug(message: string, options?: {allowHtml?: boolean}): void {
    log.debug(message, options)
  }

  /** @deprecated use log.info(..) instead */
  public logInfo(message: string, options?: {allowHtml?: boolean}): void {
    log.info(message, options)
  }

  /** @deprecated use log.warning(..) instead */
  public logWarning(message: string, options?: {allowHtml?: boolean}): void {
    log.warning(message, options)
  }

  /** @deprecated use log.errorAndThrow(..) instead */
  public logError(message: string, options?: {allowHtml?: boolean}): never {
    log.errorAndThrow(message, options)
  }

  /** @deprecated use log.errorWithoutThrow(..) instead */
  public logErrorWithoutThrow(message: string, options?: {allowHtml?: boolean}): void {
    log.errorWithoutThrow(message, options)
  }

  public createWebLinkHtml(address: string, label?: string): string { // TODO: return RenderElement instead
    return `<a style="color:skyblue;" target="_blank" href="${address}">${label ?? address}</a>`
  }

  // TODO: move to HintManager/HintComponent
  public readonly hintToDeactivateSnapToGrid: string = 'Press CTRL to deactivate snapToGrid'
  private readonly hintId: string = 'hint'
  private hint: string|null = null
  public async setHint(hint: string, active: boolean): Promise<void> {
    if (active) {
      if (!this.hint) {
        this.hint = hint
        await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${this.hintId}" class="${style.getHintClass()}">${hint}</div>`)
      } else if (this.hint !== hint) {
        this.hint = hint
        await renderManager.setContentTo(this.hintId, hint)
      }
    } else {
      if (this.hint === hint) {
        this.hint = null
        await renderManager.remove(this.hintId)
      }
    }
  }

  // TODO: move to mouseEventBlockerScreenOverlay.ts file
  private mouseEventBlockerScreenOverlayState: 'notInitialized'|'active'|'inactive' = 'notInitialized'
  public async setMouseEventBlockerScreenOverlay(active: boolean, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    const mouseEventBlockerScreenOverlayId: string = 'mouseEventBlockerScreenOverlay'
    const pros: Promise<void>[] = []

    if (active) {
      if (this.mouseEventBlockerScreenOverlayState === 'notInitialized') {
        const mapOverlayMoveLock: RenderElement = {
          type: 'div', 
          id: mouseEventBlockerScreenOverlayId,
          style: {position: "fixed", top: "0px", width: "100%", height: "100%"}
        }
        pros.push(renderManager.addElementTo(indexHtmlIds.bodyId, mapOverlayMoveLock, priority))
      } else {
        pros.push(renderManager.appendChildTo(indexHtmlIds.bodyId, mouseEventBlockerScreenOverlayId, priority))
      }
      this.mouseEventBlockerScreenOverlayState = 'active'

    } else {
      if (this.mouseEventBlockerScreenOverlayState === 'active') {
        pros.push(renderManager.appendChildTo(indexHtmlIds.unplacedElementsId, mouseEventBlockerScreenOverlayId, priority))
        this.mouseEventBlockerScreenOverlayState = 'inactive'
      }
    }

    await Promise.all(pros)
  }

  public stringify(object: any): string {
    const visitedObjects: any[] = []

    return JSON.stringify(object, (key: string, value: string) => {
      if (value && visitedObjects.includes(value)) {
        return value.toString() // TODO: getId() if existing
      }
      visitedObjects.push(value)
      return value
    }, '\t')
  }

  public getIndentationDepth(line: string, numberOfSpacesMatchingOneTab: number = 2): number {
    const spacesForTab: string = ' '.repeat(numberOfSpacesMatchingOneTab)
    let restLine: string = line
    let indentation: number = 0
    for (; restLine.length > 0; indentation++) {
      if (restLine.startsWith('\t')) {
        restLine = restLine.substring(1)
        continue
      } else if (restLine.startsWith(spacesForTab)) {
        restLine = restLine.substring(numberOfSpacesMatchingOneTab)
        continue
      }
      break
    }
    return indentation
  }

  public consistsOnlyOfEmptySpace(line: string): boolean {
    return line.match(/^\s*$/) !== null
  }

  public consistsOnlyOfEmptySpaceExcept(line: string, exception: string): boolean {
    let escapedException: string = ''
    for (let char of exception) {
      if (char === '[' || char === ']') {
        escapedException += '\\'+char
      } else {
        escapedException += '['+char+']'
      }
    }
    return line.match('^\\s*'+escapedException+'\\s*$') !== null
  }

  public escapeForHtml(text: string): string {
    var content: string = '';
    for (let i = 0; i < text.length; i++) {
      // TODO this is maybe very inefficient
      content += this.escapeCharForHtml(text[i])
    }
    return content
  }

  private escapeCharForHtml(c: string): string {
    switch (c) {
      case '\\':
        return '&#92;'
      case '\n':
        return '<br/>'
      case '\r':
        return ''
      case '\'':
        return '&#39;'
      case '"':
        return '&quot;'
      case '`':
        return '&#96;'
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

  // TODO: introduce Path class and move path util methods there

  public joinPaths(paths: string[]): string {
    let jointedPath: string = ''
    for (let path of paths) {
      path = this.replaceBackslashesWithSlashes(path)
      jointedPath = this.concatPaths(jointedPath, path)
    }
    return jointedPath
  }

  public concatPaths(left: string, right: string): string {
    if (left === '') {
      return right
    }

    if (!left.endsWith('/') && !right.startsWith('/')) {
      left += '/'
    } else if (left.endsWith('/') && right.startsWith('/')) {
      right = right.substring(1)
    }
    if (right.startsWith('./')) {
      right = right.substring(2)
    }
    while (right.startsWith('../')) {
      left = this.removeLastElementFromPath(left)
      right = right.substring(3)
    }
    return left+right
  }

  public getElementCountOfPath(path: string): number {
    return this.getElementsOfPath(path).length
  }

  public getElementsOfPath(path: string): string[] {
    let preprocessedPath: string = path
    if (path === '/') {
      return ['/']
    }

    if (path.startsWith('./') && path !== './') {
      preprocessedPath = path.substring(2)
    } else if (path.startsWith('/')) {
      preprocessedPath = path.substring(1)
    } else {
      preprocessedPath = path.replace(/^[\w]+[:][/][/]/, '')
    }

    if (preprocessedPath.endsWith('/')) {
      preprocessedPath = preprocessedPath.substring(0, preprocessedPath.length-1)
    }
    
    const elements: string[] = preprocessedPath.split('/')
    if (elements.includes('')) {
      this.logWarning(`Util::getElementsOfPath(..) struggling to interpret path '${path}', filtering out empty elements in '[${elements}]'.`)
      return elements.filter(element => element.length > 0)
    }
    return elements
  }

  public removeStartFromPath(start: string, path: string): string {
    if (!path.startsWith(start)) {
      log.warning(`Util::removeStartFromPath(..) path '${path}' does not start with start '${start}'.`)
    }
    let remainingPath: string = path.substring(start.length)
    if (remainingPath.startsWith('/') || remainingPath.startsWith('\\')) {
      remainingPath = remainingPath.substring(1)
    }
    return remainingPath
  }

  public removeLastElementFromPath(path: string): string {
    path = this.replaceBackslashesWithSlashes(path)
    return path.replace(/[/][^/]*.$/, '/')
  }

  public replaceBackslashesWithSlashes(s: string) {
    return s.split('\\').join('/')
  }

  public matchFileNames(name: string, otherName: string, options?: {ignoreFileEndings?: boolean}): boolean {
    if (!options?.ignoreFileEndings) {
      return name === otherName
    }

    const nameFileEndingIndex: number = name.lastIndexOf('.')
    const otherNameFileEndingIndex: number = otherName.lastIndexOf('.')
    const nameWithoutFileEnding: string = nameFileEndingIndex > 0 ? name.substring(0, nameFileEndingIndex) : name
    const otherNameWithoutFileEnding: string = otherNameFileEndingIndex > 0 ? otherName.substring(0, otherNameFileEndingIndex) : otherName

    return name === otherNameWithoutFileEnding || nameWithoutFileEnding === otherName || nameWithoutFileEnding === otherNameWithoutFileEnding
  }

  public toFormattedJson(object: any) {
    return JSON.stringify(object, null, '\t')
  }

  public stylesToCssText(styles: {[key: string]: Style}): string {
    let cssText: string = ''
    for (const [styleRuleName, style] of Object.entries(styles)) {
        cssText += `.${styleRuleName}{`
        for (const [key, value] of Object.entries(style)) {
            cssText += `${key.replaceAll(/[A-Z]/g, match => '-'+match)}:${value};`
        }
        cssText += '}'
    }
    return cssText
  }
  
  public generateId(): string {
    return Math.random().toString(32).substring(2)
  }

  public wait(milliSeconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliSeconds))
  }

  public getCallerDirPath(skipThroughFilePath?: string): string {
    if (!skipThroughFilePath) {
      skipThroughFilePath = stacktraceUtil.getCallerFilePath(__filename)
    }

    return stacktraceUtil.getCallerDirPath(skipThroughFilePath)
  }

  public getCallerFilePath(skipThroughFilePath?: string): string {
    if (!skipThroughFilePath) {
      skipThroughFilePath = stacktraceUtil.getCallerFilePath(__filename)
    }

    return stacktraceUtil.getCallerFilePath(skipThroughFilePath)
  }

  public getCallStackPaths(): string[] {
    return stacktraceUtil.getCallStackPaths()
  }

}

export let util: Util = new Util()
