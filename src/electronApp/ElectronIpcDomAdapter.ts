import { util } from '../core/util/util'
import { RenderElement, RenderElements, Style } from '../core/util/RenderElement'
import { BrowserWindow, WebContents, Point, Rectangle, screen, IpcMainEvent } from 'electron'
import { ClientRect } from '../core/ClientRect'
import { ClientPosition } from '../core/shape/ClientPosition'
import { BatchMethod, DocumentObjectModelAdapter, DragEventType, EventListenerCallback, EventType, InputEventType, MouseEventResultAdvanced, MouseEventType, WheelEventType } from '../core/domAdapter'
import { IpcChannelRegister, IpcEventListenerHandle } from './IpcChannelRegister'

export class ElectronIpcDomAdapter implements DocumentObjectModelAdapter {
    private renderWindow: BrowserWindow
    private webContents: WebContents
    private ipcChannelRegister: IpcChannelRegister = new IpcChannelRegister()
    // TODO: implement cleanup mechanism that is scheduled by RenderManager when there is not much load to cleanup a small chunk (1+0.1%) of dangling ipcEventChannels
    // introduce RenderPriority.BACKGROUND for this
    // asks frontend if element for ipcChannel still exists
  
    public constructor(windowToRenderIn: BrowserWindow) {
      this.renderWindow = windowToRenderIn
      this.webContents = this.renderWindow.webContents
      this.webContents.executeJavaScript('const ipcToNativeListenerRegister = new Map();')
      // TODO: define 'let ipc = require("electron").ipcRenderer;' in renderer only once
    }
  
    public openDevTools(): void {
      this.webContents.openDevTools()
    }
  
    public getClientSize(): {width: number, height: number} {
      const size: number[] = this.renderWindow.getContentSize()
      return {width: size[0], height: size[1]}
    }
  
    public getCursorClientPosition(): {x: number, y: number} {
      const cursorScreenPosition: Point = screen.getCursorScreenPoint()
      const contentBounds: Rectangle = this.renderWindow.getContentBounds()
  
      return {x: cursorScreenPosition.x - contentBounds.x, y: cursorScreenPosition.y - contentBounds.y}
    }
  
    public async isElementHovered(id: string): Promise<boolean> {
      return this.executeJsOnElement(id, 'matches(":hover")')
    }
  
    public async getClientRectOf(id: string): Promise<ClientRect> {
      // implemented workaround because following line doesn't work, because 'Error: An object could not be cloned.'
      //return await executeJsOnElement(id, "getBoundingClientRect()").catch(reason => util.logError(reason))
  
      let js = 'let rect = document.getElementById("' + id + '").getBoundingClientRect();'
      js += 'return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};' // manual copy because DOMRect could not be cloned
  
      // not executeJavaScript because of "UnhandledPromiseRejectionWarning: Unhandled promise rejection."
      const rect = await this.executeJavaScriptInFunction(js)
  
      return new ClientRect(rect.x, rect.y, rect.width, rect.height) // manual copy because object from renderer has no functions
    }
  
    public batch(batch: {elementId: string, method: BatchMethod, value: string|RenderElement|RenderElements}[]): Promise<void> {
      const jsCommands: string[] = batch.map(command => {
        switch (command.method) {
          case 'appendChildTo':
            return this.createAppendChildJavaScript(command.elementId, command.value as string)
  
          case 'addContentTo':
            const addContentJs: string = this.createAddContentJavaScript(command.elementId, command.value as string)
            return this.wrapJavaScriptInFunction(addContentJs) // wrap in function because otherwise "Uncaught SyntaxError: Identifier 'temp' has already been declared"
  
          case 'addElementsTo':
            const addElementsJs: string = this.createAddElementsJavaScriptAndAddIpcChannelListeners(command.elementId, command.value as RenderElements)
            return this.wrapJavaScriptInFunction(addElementsJs) // wrap in function because otherwise "Uncaught SyntaxError: Identifier 'element' has already been declared"
          
          case 'addElementTo':
            const addElementJs: string = this.createAddElementJavaScriptAndAddIpcChannelListeners(command.elementId, command.value as RenderElement)
            return this.wrapJavaScriptInFunction(addElementJs) // wrap in function because otherwise "Uncaught SyntaxError: Identifier 'element' has already been declared"
  
          case 'setElementsTo':
            let setElementsJs: string = this.createSetElementsJavaScriptAndAddIpcChannelListeners(command.elementId, command.value as RenderElements)
            return this.wrapJavaScriptInFunction(setElementsJs) // wrap in function because otherwise "Uncaught SyntaxError: Identifier 'element' has already been declared"
  
          case 'setElementTo':
            let setElementJs: string = this.createSetElementJavaScriptAndAddIpcChannelListeners(command.elementId, command.value as RenderElement)
            return this.wrapJavaScriptInFunction(setElementJs) // wrap in function because otherwise "Uncaught SyntaxError: Identifier 'element' has already been declared"
  
          case 'innerHTML':
            return `document.getElementById('${command.elementId}').innerHTML='${command.value}';`// TODO: fails if innerHTML includes "'"

          case 'style': // TODO: style is a readonly property, find better solution
            if (typeof command.value === 'string') {
              return `document.getElementById('${command.elementId}').style='${command.value}';` // TODO: fails if style includes "'"
            } else {
              const elementName = 'elementToSetStyle'+command.elementId
              return `const ${elementName} = document.getElementById('${command.elementId}');${this.createSetStyleJavaScript(elementName, command.value as Style)}`
            }
  
          case 'addClassTo':
            return `document.getElementById('${command.elementId}').classList.add('${command.value}');`
  
          case 'removeClassFrom':
            return `document.getElementById('${command.elementId}').classList.remove('${command.value}');`
  
          default:
            util.logWarning(`Method of batchCommand '${command.method}' not known.`)
            return ''
        }
      })
  
      return this.executeJavaScript(jsCommands.join(''))
    }
  
    public appendChildTo(parentId: string, childId: string): Promise<void> {
      return this.executeJavaScript(this.createAppendChildJavaScript(parentId, childId))
    }
  
    private createAppendChildJavaScript(parentId: string, childId: string): string {
      return `document.getElementById("${parentId}").append(document.getElementById("${childId}"));`
    }
  
    public addContentTo(id: string, content: string): Promise<void> {
      return this.executeJavaScriptSuppressingErrors(this.createAddContentJavaScript(id, content))
    }
  
    private createAddContentJavaScript(id: string, content: string): string {
      let js = 'const temp = document.createElement("template");'
      js += 'temp.innerHTML = \''+content+'\';'
      js += 'document.getElementById("'+id+'").append(temp.content);'
      return js
    }
  
    public addElementsTo(id: string, elements: RenderElements): Promise<void> {
      return this.executeJavaScript(this.createAddElementsJavaScriptAndAddIpcChannelListeners(id, elements))
    }
  
    public addElementTo(id: string, element: RenderElement): Promise<void> {
      return this.executeJavaScript(this.createAddElementJavaScriptAndAddIpcChannelListeners(id, element))
    }
  
    public setElementsTo(id: string, elements: RenderElements): Promise<void> {
      return this.executeJavaScript(this.createSetElementsJavaScriptAndAddIpcChannelListeners(id, elements))
    }
  
    public setElementTo(id: string, element: RenderElement): Promise<void> {
      return this.executeJavaScript(this.createSetElementJavaScriptAndAddIpcChannelListeners(id, element))
    }
  
    private createAddElementsJavaScriptAndAddIpcChannelListeners(id: string, elements: RenderElements): string {
      if (!Array.isArray(elements)) {
        return this.createAddElementJavaScriptAndAddIpcChannelListeners(id, elements)
      }
  
      let js: string = elements.map((element, index) => this.createHtmlElementJavaScriptAndAddIpcChannelListeners(element, 'element'+index)).join('')
      const elementJsNames: string[] = elements.map((_, index) => 'element'+index)
      js += `document.getElementById("${id}").append(${elementJsNames.join(',')});`
      return js
    }
  
    private createAddElementJavaScriptAndAddIpcChannelListeners(id: string, element: string|RenderElement): string {
      let js: string = this.createHtmlElementJavaScriptAndAddIpcChannelListeners(element)
      js += `document.getElementById("${id}").append(element);`
      return js
    }
  
    private createSetElementsJavaScriptAndAddIpcChannelListeners(id: string, elements: RenderElements): string {
      let js: string = `document.getElementById("${id}").innerHTML="";` // TODO: is there no set(element) method?
      js += this.createAddElementsJavaScriptAndAddIpcChannelListeners(id, elements)
      return js
    }
  
    private createSetElementJavaScriptAndAddIpcChannelListeners(id: string, element: string|RenderElement): string {
      let js: string = this.createHtmlElementJavaScriptAndAddIpcChannelListeners(element)
      js += `document.getElementById("${id}").innerHTML="";`
      js += `document.getElementById("${id}").append(element);` // TODO: is there no set(element) method?
      return js
    }
  
    private createHtmlElementJavaScriptAndAddIpcChannelListeners(element: string|RenderElement, elementJsName: string = 'element'): string {
      if (typeof element === 'string') {
        return `const ${elementJsName} = document.createTextNode("${element}");` // TODO: escape '"'
      }
  
      // TODO: find way to pass object directly to renderer thread and merge attributes into domElement
      let js = `const ${elementJsName} = document.createElement("${element.type}");`
  
      element = this.interceptEventHandlersWithJsAndAddIpcChannelListeners(element)
  
      for (const field in element) {
        const fieldValue = element[field as keyof RenderElement]
        if (field === 'type' || field === 'children') {
          // these fields are not assignable
          continue
        }
        if (field === 'style') {
          js += this.createSetStyleJavaScript(elementJsName, fieldValue as Style)
        } else if (field === 'innerHTML') {
          if ((fieldValue as string).includes("'")) {
            if ((fieldValue as string).includes('"')) {
              util.logWarning(`innerHTML "${fieldValue}" includes both singleQuotes and doubleQuotes, this can lead to escape mistakes`)
              js += `${elementJsName}.innerHTML="${(fieldValue as string).replaceAll('"', '&quot;')}";`
            } else {
              js += `${elementJsName}.innerHTML="${fieldValue}";`
            }
          } else {
            js += `${elementJsName}.innerHTML='${fieldValue}';`
          }
        } else if (typeof fieldValue === 'string' && !field.startsWith('on')) { // event handlers where parsed to js string in intercept method above
          js += `${elementJsName}.${field}="${fieldValue}";`
        } else {
          js += `${elementJsName}.${field}=${fieldValue};`
        }
      }

      if (!element.children) {
        return js
      }

      if (!Array.isArray(element.children)) {
        const child: string|RenderElement = element.children
        const childJsName: string = `${elementJsName}i`
        js += this.createHtmlElementJavaScriptAndAddIpcChannelListeners(child, childJsName)
        js += `${elementJsName}.append(${childJsName});`
        return js
      }
  
      for (let i = 0; i < element.children.length; i++) {
        const child: string|RenderElement = element.children[i]
        const childJsName: string = `${elementJsName}i${i}`
        js += this.createHtmlElementJavaScriptAndAddIpcChannelListeners(child, childJsName)
        js += `${elementJsName}.append(${childJsName});`
      }
  
      return js
    }
  
    private interceptEventHandlersWithJsAndAddIpcChannelListeners(element: RenderElement): RenderElement {
      for (const field in element) {
        if (!field.startsWith('on')) {
          continue
        }
        let id: string
        if (!element.id) {
          util.logWarning(`Element seems to have '${field}' event handler but no id.`)
          id = 'generated'+util.generateId()
        } else {
          id = element.id
        }
  
        let ipcChannelName: string
        switch (field) { // TODO: handle all events
          case 'onclick':
            ipcChannelName = this.addMouseEventChannelListener(id, 'click', element[field]!)
            element.onclick = this.createMouseEventRendererFunction(ipcChannelName) as any
            continue
  
          case 'onchangeValue':
            ipcChannelName = this.addChangeEventChannelListener(id, 'change', element[field]!)
            if ((element as any).onchange) {
              util.logWarning(`There are multiple onchange event handlers for element with id '${element.id}', only one will work.`)
            }
            (element as any).onchange = this.createChangeEventRendererFunction(ipcChannelName, 'value')
            element.onchangeValue = undefined
            continue
  
          case 'onchangeChecked':
            ipcChannelName = this.addChangeEventChannelListener(id, 'change', element[field]!)
            if ((element as any).onchange) {
              util.logWarning(`There are multiple onchange event handlers for element with id '${element.id}', only one will work.`)
            }
            (element as any).onchange = this.createChangeEventRendererFunction(ipcChannelName, 'checked')
            element.onchangeChecked = undefined
            continue
  
          default:
            util.logWarning(`'${field}' event handlers are not yet implemented.`)
        }
      }
  
      return element
    }

    // TODO: at least create javascriptSnippetGenerator and move javascript generation there
    private createSetStyleJavaScript(elementJsName: string, style: Style): string {
      let js = ''

      for (const styleField in style) {
        const styleFieldValue = style[styleField]
        if (typeof styleFieldValue === 'string') {
          js += `${elementJsName}.style.${styleField}="${styleFieldValue}";`
        } else {
          js += `${elementJsName}.style.${styleField}=${styleFieldValue};`
        }
      }

      return js
    }
  
    public setContentTo(id: string, content: string): Promise<void> {
      return this.executeJsOnElementSuppressingErrors(id, "innerHTML = '"+content+"'") // TODO: fails if innerHTML includes "'"
    }
  
    public clearContentOf(id: string): Promise<void> {
      return this.executeJsOnElementSuppressingErrors(id, "innerHTML=''")
    }
  
    public remove(id: string): Promise<void> {
      return this.executeJsOnElementSuppressingErrors(id, "remove()")
    }
  
    public setStyleTo(id: string, style: string|Style): Promise<void> {
      if (typeof style === 'string') {
        return this.executeJsOnElementSuppressingErrors(id, "style = '"+style+"'") // TODO: style is a readonly property, find better solution, also fails if style includes "'"
      }

      let js = `const element = document.getElementById("${id}");`
      js += this.createSetStyleJavaScript('element', style)
      return this.executeJavaScript(js)
    }
  
    public addClassTo(id: string, className: string): Promise<void> {
      return this.executeJsOnElementSuppressingErrors(id, "classList.add('"+className+"')")
    }
  
    public removeClassFrom(id: string, className: string): Promise<void> {
      return this.executeJsOnElementSuppressingErrors(id, "classList.remove('"+className+"')")
    }
  
    public containsClass(id: string, className: string): Promise<boolean> {
      return this.executeJsOnElement(id, "classList.contains('"+className+"')")
    }
  
    public getClassesOf(id: string): Promise<string[]> {
      return this.executeJsOnElement(id, "classList")  // throws error: object could not be cloned
    }
  
    public async modifyCssRule(cssRuleName: string, propertyName: string, propertyValue: string): Promise<{propertyValueBefore: string}> {
      let jsToExecute: string = `let styleSheet = document.styleSheets[0]
      for (const rule of styleSheet.rules) {
        if (rule.selectorText === "${cssRuleName}") {
          const propertyValueBefore = rule.style.${propertyName}
          rule.style.${propertyName} = "${propertyValue}"
          return propertyValueBefore
        }
      }
      throw new Error("CssRule with name '${cssRuleName}' not found.")`
  
      return {propertyValueBefore: await this.executeJavaScriptInFunction(jsToExecute)}
    }
  
    public getValueOf(id: string): Promise<string> {
      return this.executeJsOnElement(id, "value")
    }
  
    public setValueTo(id: string, value: string): Promise<void> {
      return this.executeJsOnElementSuppressingErrors(id, "value='"+value+"'")
    }
  
    public scrollToBottom(id: string): Promise<void> {
      return this.executeJsOnElementSuppressingErrors(id, "scrollTop = Number.MAX_SAFE_INTEGER")
    }
  
    public async addKeydownListenerTo(id: string, key: 'Enter', callback: (value: string) => void): Promise<void> {
      const ipcChannelName: string = this.ipcChannelRegister.addEventListener(id, 'keydown', callback, (_: IpcMainEvent, value: string) => callback(value))
  
      let rendererFunction: string = '(event) => {'
      rendererFunction += 'let ipc = require("electron").ipcRenderer;'
      //rendererFunction += 'console.log(event);'
      rendererFunction += 'if (event.key === "'+key+'") {'
      rendererFunction += 'ipc.send("'+ipcChannelName+'", event.target.value);'
      rendererFunction += '}'
      rendererFunction += '}'
  
      await this.addEventListenerJs(id, 'keydown', ipcChannelName, rendererFunction)
    }
  
    public async addChangeListenerTo<RETURN_TYPE>(
      id: string,
      returnField: 'value'|'checked',
      callback: (value: RETURN_TYPE) => void
    ): Promise<void> {
      const ipcChannelName: string = this.addChangeEventChannelListener(id, 'change', callback)
      const rendererFunction: string = this.createChangeEventRendererFunction(ipcChannelName, returnField)
      await this.addEventListenerJs(id, 'change', ipcChannelName, rendererFunction)
    }
  
    public async addWheelListenerTo(id: string, callback: (delta: number, clientX: number, clientY: number) => void): Promise<void> {
      const ipcChannelName: string = this.ipcChannelRegister.addEventListener(
        id, 'wheel', callback,
        (_: IpcMainEvent, deltaY: number, clientX:number, clientY: number) => callback(deltaY, clientX, clientY)
      )
  
      let rendererFunction: string = '(event) => {'
      rendererFunction += 'let ipc = require("electron").ipcRenderer;'
      //rendererFunction += 'console.log(event);'
      rendererFunction += 'ipc.send("'+ipcChannelName+'", event.deltaY, event.clientX, event.clientY);'
      rendererFunction += '}'
  
      await this.addEventListenerJs(id, 'wheel', ipcChannelName, rendererFunction)
  
    }
  
    public async addEventListenerAdvancedTo(
      id: string,
      eventType: MouseEventType,
      options: {stopPropagation: boolean, capture?: boolean},
      callback: (result: MouseEventResultAdvanced) => void
    ): Promise<void> {
      const ipcChannelName: string = this.ipcChannelRegister.addEventListener(
        id, eventType, callback,
        (_: IpcMainEvent, clientX: number, clientY: number, ctrlPressed: boolean, cursor: any, targetPathElementIds: string[]) => callback({
          position: new ClientPosition(clientX, clientY), ctrlPressed, cursor, targetPathElementIds
        }),
        options.capture
      )
  
      let rendererFunction: string = '(event) => {'
      rendererFunction += 'let ipc = require("electron").ipcRenderer;'
      //rendererFunction += 'console.log(event);'
      if (options.stopPropagation) {
        rendererFunction += 'event.stopPropagation();'
      }
      rendererFunction += 'let cursor = window.getComputedStyle(event.target)["cursor"];'
      rendererFunction += 'const targetPathElementIds = [];'
      rendererFunction += 'for (let targetPathElement = event.target; targetPathElement; targetPathElement = targetPathElement.parentElement) {'
      rendererFunction += 'targetPathElementIds.unshift(targetPathElement.id);'
      rendererFunction += '}'
      rendererFunction += 'ipc.send("'+ipcChannelName+'", event.clientX, event.clientY, event.ctrlKey, cursor, targetPathElementIds);'
      rendererFunction += '}'
  
      await this.addEventListenerJs(id, eventType, ipcChannelName, rendererFunction, options.capture)
    }
  
    public async addEventListenerTo(
      id: string,
      eventType: MouseEventType,
      callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void
    ): Promise<void> {
      const ipcChannelName: string = this.addMouseEventChannelListener(id, eventType, callback)
      const rendererFunction: string = this.createMouseEventRendererFunction(ipcChannelName)
      await this.addEventListenerJs(id, eventType, ipcChannelName, rendererFunction)
    }
  
    private createChangeEventRendererFunction(ipcChannelName: string, returnField: 'value'|'checked'): string {
      let rendererFunction: string = '(event) => {'
      rendererFunction += 'let ipc = require("electron").ipcRenderer;'
      //rendererFunction += 'console.log(event);'
      rendererFunction += 'ipc.send("'+ipcChannelName+'", event.target.'+returnField+');'
      rendererFunction += '}'
      return rendererFunction
    }
  
    private createMouseEventRendererFunction(ipcChannelName: string): string {
      let rendererFunction: string = '(event) => {'
      rendererFunction += 'let ipc = require("electron").ipcRenderer;'
      //rendererFunction += 'console.log(event);'
      rendererFunction += 'event.stopPropagation();'
      rendererFunction += 'ipc.send("'+ipcChannelName+'", event.clientX, event.clientY, event.ctrlKey);'
      rendererFunction += '}'
      return rendererFunction
    }
  
    private addChangeEventChannelListener<RETURN_TYPE>(id: string, eventType: InputEventType, callback: (value: RETURN_TYPE) => void): string {
      return this.ipcChannelRegister.addEventListener(id, eventType, callback, (_: IpcMainEvent, value: RETURN_TYPE) => callback(value))
    }
  
    private addMouseEventChannelListener(
      id: string, eventType: MouseEventType, callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void
    ): string {
      return this.ipcChannelRegister.addEventListener(
        id, eventType, callback,
        (_: IpcMainEvent, clientX: number, clientY: number, ctrlPressed: boolean) => callback(clientX, clientY, ctrlPressed)
      )
    }
  
    public async addDragListenerTo(
      id: string,
      eventType: DragEventType,
      callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void
    ): Promise<void> {
      const ipcChannelName: string = this.ipcChannelRegister.addEventListener(
        id, eventType, callback,
        (_: IpcMainEvent, clientX: number, clientY: number, ctrlPressed: boolean) => callback(clientX, clientY, ctrlPressed)
      )

      let rendererFunction: string = '(event) => {'
      rendererFunction += 'let ipc = require("electron").ipcRenderer;'
      //rendererFunction += 'console.log(event);'
      rendererFunction += 'event.stopPropagation();'
      if (eventType === 'dragstart') {
        rendererFunction += 'event.dataTransfer.setDragImage(new Image(), 0, 0);'
      }
      rendererFunction += 'if (event.clientX != 0 || event.clientY != 0) {'
      rendererFunction += 'ipc.send("'+ipcChannelName+'", event.clientX, event.clientY, event.ctrlKey);'
      rendererFunction += '}'
      rendererFunction += '}'
  
      await this.addEventListenerJs(id, eventType, ipcChannelName, rendererFunction)
    }

    private async addEventListenerJs(id: string, eventType: EventType, ipcChannelName: string, rendererFunctionJs: string, capture?: boolean): Promise<void> {
      let js = `ipcToNativeListenerRegister.set("${ipcChannelName}", ${rendererFunctionJs});`
      js += `document.getElementById("${id}").addEventListener("${eventType}", ipcToNativeListenerRegister.get("${ipcChannelName}"), ${capture});`
      // in line above ipcToNativeListenerRegister.get(..) important, otherwise new anonymous listener would be created that cannot be removed
      await this.executeJavaScript(js)
    }
  
    public async removeEventListenerFrom(id: string, eventType: EventType, listener?: EventListenerCallback): Promise<void> {
      const listenersToRemove: IpcEventListenerHandle[] = this.ipcChannelRegister.removeEventListener(id, eventType, listener ?? 'all')
      let js = `const element = document.getElementById("${id}");`
      //js += 'console.log(ipcToNativeListenerRegister);'
      for (const listener of listenersToRemove) {
        js += `element.removeEventListener("${eventType}", ipcToNativeListenerRegister.get("${listener.getIpcChannelName(id, eventType)}"), ${listener.capture});`
        js += `ipcToNativeListenerRegister.delete("${listener.getIpcChannelName(id, eventType)}");`
      }
      //js += 'console.log(ipcToNativeListenerRegister);'
      await this.executeJavaScript(js)
    }
  
    public getIpcChannelsCount(): number {
      return this.ipcChannelRegister.getIpcChannelsCount()
    }
  
    private executeJsOnElementSuppressingErrors(elementId: string, jsToExecute: string): Promise<void> {
      return this.executeJavaScriptSuppressingErrors("document.getElementById('"+elementId+"')."+jsToExecute)
    }
  
    private executeJsOnElement(elementId: string, jsToExecute: string): Promise<any> {
      return this.executeJavaScript("document.getElementById('"+elementId+"')."+jsToExecute)
    }
  
    public async executeJavaScriptSuppressingErrors(jsToExecute: string): Promise<void> { // public only for unit tests
      try {
        await this.executeJavaScript(jsToExecute)
      } catch(error: any) {
        // TODO this should never happen anymore, remove as soon as save
        util.logWarning(error.message)
      }
    }
  
    private executeJavaScriptInFunction(jsToExecute: string): Promise<any> {
      // wrap in function because otherwise "UnhandledPromiseRejectionWarning: Error: An object could not be cloned."
      return this.executeJavaScript(this.wrapJavaScriptInFunction(jsToExecute))
    }
  
    private wrapJavaScriptInFunction(javaScript: string): string {
      return `(() => {${javaScript}}).call();`
    }
  
    public async executeJavaScript(jsToExecute: string): Promise<any> { // public only for unit tests
      // otherwise render thread would crash when error occurs
      // TODO: does not work when jsToExecute destroys escaping and leads to invalid javascript
      const rendererCode = `try {
        ${jsToExecute}
      } catch(error) {
        error
      }`
  
      const result = await this.webContents.executeJavaScript(rendererCode)
  
      if (result instanceof Error) {
        let jsToExecuteEndings: string = jsToExecute
        if (jsToExecute.length > 256+10) {
          jsToExecuteEndings = jsToExecute.substring(0, 128)+'[.'+(jsToExecute.length-256)+'.]'+jsToExecute.substring(jsToExecute.length-128)
        }
        util.logWarning('error in render thread occured: '+result.message+'. the javascript that was tried to execute was: '+jsToExecuteEndings)
      }
  
      return result
    }
  
  }