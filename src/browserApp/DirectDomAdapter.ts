import { ClientRect } from '../core/ClientRect';
import { BatchMethod, DocumentObjectModelAdapter, DragEventType, EventType, MouseEventResultAdvanced, MouseEventType } from '../core/domAdapter'
import { ClientPosition } from '../core/shape/ClientPosition';
import { util } from '../core/util/util';
import { RenderElements, RenderElement } from '../pluginFacade';

// TODO: reschedule all methods that return a Promise so that they are queued and priorized on heavy load to prevent lags
export class DirectDomAdapter implements DocumentObjectModelAdapter {
    private latestCursorClientPosition: {x: number, y: number} = {x: 0, y: 0} // TODO: set to center of screen?

    public constructor() {
        // TODO: addMouseMoveListener to document to track latestCursorClientPosition or find better solution
    }

    public openDevTools(): void {
        util.logInfo('DirectDomAdapter::openDevTools() not implemented, simply open it with browser.')
    }

    public getClientSize(): { width: number; height: number; } {
        return {width: window.screen.width, height: window.screen.height}
    }
    
    public getCursorClientPosition(): { x: number; y: number; } {
        return this.latestCursorClientPosition
    }

    public getElementOrFail(id: string): HTMLElement|never {
        const element: HTMLElement|null = document.getElementById(id)
        if (!element) {
            // TODO: improve, util.logError(..) can go very wrong when getting elements to log message fails (cycle)
            util.logError(`DirectDomAdapter::getElementOrFail(id: string) failed to get element with id ${id}.`)
        }
        return element
    }

    public async isElementHovered(id: string): Promise<boolean> {
        return this.getElementOrFail(id).matches(":hover")
    }

    public async getClientRectOf(id: string): Promise<ClientRect> {
        const rect: DOMRect = this.getElementOrFail(id).getBoundingClientRect()
        return new ClientRect(rect.x, rect.y, rect.width, rect.height)
    }

    public async batch(batch: { elementId: string; method: BatchMethod; value: RenderElements; }[]): Promise<void> {
        const pros: Promise<any>[] = batch.map(async command => {
            switch (command.method) { // TODO: sync calls could lead to lags, call async methods?
                case 'appendChildTo':
                    return this.appendChildToSync(command.elementId, command.value as string)
        
                case 'addContentTo':
                    return this.addContentToSync(command.elementId, command.value as string)
        
                case 'addElementsTo':
                    return this.addElementsToSync(command.elementId, command.value)
                
                case 'addElementTo':
                    return this.addElementToSync(command.elementId, command.value as RenderElement)
        
                case 'setElementsTo':
                    return this.setElementsToSync(command.elementId, command.value)
        
                case 'setElementTo':
                    return this.setElementToSync(command.elementId, command.value as RenderElement)
        
                case 'innerHTML':
                    return this.getElementOrFail(command.elementId).innerHTML=command.value as string

                case 'style':
                    return this.setStyleToSync(command.elementId, command.value as string)
        
                case 'addClassTo':
                  return this.getElementOrFail(command.elementId).classList.add(command.value as string)
        
                case 'removeClassFrom':
                  return this.getElementOrFail(command.elementId).classList.remove(command.value as string)
        
                default:
                  util.logWarning(`Method of batchCommand '${command.method}' not known.`)
                  return
            }
        })
        await Promise.all(pros)
    }

    public async appendChildTo(parentId: string, childId: string): Promise<void> {
        this.appendChildToSync(parentId, childId)
    }
    public appendChildToSync(parentId: string, childId: string): void {
        this.getElementOrFail(parentId).appendChild(this.getElementOrFail(childId))
    }

    public async addContentTo(id: string, content: string): Promise<void> {
        this.addContentToSync(id, content)
    }
    public addContentToSync(id: string, content: string): void {
        const temp = document.createElement("template")
        temp.innerHTML = content
        this.getElementOrFail(id).append(temp.content)
    }

    public async addElementsTo(id: string, elements: RenderElements): Promise<void> {
        this.addElementsToSync(id, elements)
    }
    private addElementsToSync(id: string, elements: RenderElements): void {
        this.getElementOrFail(id).append(...this.createHtmlElementsFrom(elements))
    }

    public async addElementTo(id: string, element: RenderElement): Promise<void> {
        this.addElementToSync(id, element)
    }
    private addElementToSync(id: string, element: RenderElement): void {
        this.getElementOrFail(id).append(...this.createHtmlElementsFrom(element))
    }

    public async setElementsTo(id: string, elements: RenderElements): Promise<void> {
        this.setElementsToSync(id, elements)
    }
    public setElementsToSync(id: string, elements: RenderElements): void {
        const elementToSetInto: HTMLElement = this.getElementOrFail(id)
        elementToSetInto.innerHTML="" // TODO: is there no set(element) method?
        elementToSetInto.append(...this.createHtmlElementsFrom(elements))
    }

    public async setElementTo(id: string, element: RenderElement): Promise<void> {
        this.setElementToSync(id, element)
    }
    public setElementToSync(id: string, element: RenderElement): void {
        const elementToSetInto: HTMLElement = this.getElementOrFail(id)
        elementToSetInto.innerHTML="" // TODO: is there no set(element) method?
        elementToSetInto.append(this.createHtmlElementFrom(element))
    }

    private createHtmlElementsFrom(elements: RenderElements): Node[] {
        if (!Array.isArray(elements)) {
            return [this.createHtmlElementFrom(elements)]
        }
        return elements.map(element => this.createHtmlElementFrom(element))
    }

    private createHtmlElementFrom(element: string|RenderElement): Node {
        if (typeof element === 'string') {
            return document.createTextNode(element)
        }
        const node: HTMLElement = document.createElement(element.type)
        ;(node.attributes as any) = element.attributes // TODO: cast to any because attributes is a readonly property, find better solution
        ;(node.children as any) = this.createHtmlElementsFrom(element.children) // TODO: cast to any because children is a readonly property, find better solution
        return node
    }

    public async setContentTo(id: string, content: string): Promise<void> {
        this.getElementOrFail(id).innerHTML=content
    }

    public async clearContentOf(id: string): Promise<void> {
        this.getElementOrFail(id).innerHTML=''
    }

    public async remove(id: string): Promise<void> {
        this.getElementOrFail(id).remove()
    }

    public async setStyleTo(id: string, style: string): Promise<void> {
        this.setStyleToSync(id, style)
    }
    public setStyleToSync(id: string, style: string): void {
        (this.getElementOrFail(id).style as any)=style // TODO: cast to any because style is a readonly property, find better solution
    }

    public async addClassTo(id: string, className: string): Promise<void> {
        this.getElementOrFail(id).classList.add(className)
    }

    public async removeClassFrom(id: string, className: string): Promise<void> {
        this.getElementOrFail(id).classList.remove(className)
    }

    public async containsClass(id: string, className: string): Promise<boolean> {
        return this.getElementOrFail(id).classList.contains(className)
    }

    public async getClassesOf(id: string): Promise<string[]> {
        const classNames: string[] = []
        this.getElementOrFail(id).classList.forEach(className => classNames.push(className))
        return classNames
    }

    public modifyCssRule(cssRuleName: string, propertyName: string, propertyValue: string): Promise<{ propertyValueBefore: string; }> {
        throw new Error('DirectDomAdapter::modifyCssRule(..) not implemented yet.');
    }
    
    public async getValueOf(id: string): Promise<string> {
        return (this.getElementOrFail(id) as any).value // TODO: cast to any because value does not exist on all types of HTMLElement, find better solution
    }

    public async setValueTo(id: string, value: string): Promise<void> {
        (this.getElementOrFail(id) as any).value = value // TODO: cast to any because value does not exist on all types of HTMLElement, find better solution
    }

    public async scrollToBottom(id: string): Promise<void> {
        this.getElementOrFail(id).scrollTop = Number.MAX_SAFE_INTEGER
    }

    // TODO: rename to addKeydownListenerTo
    public async addKeypressListenerTo(id: string, key: 'Enter', callback: (value: string) => void): Promise<void> {
        this.getElementOrFail(id).onkeypress = (event) => { // TODO: onkeypress is depcrecated, use onkeydown instead
            //console.log(event)
            if (event.key === key) {
                if (!event.target) {
                    util.logWarning('DirectDomAdapter::addKeypressListenerTo(..) event.target is null')
                    return
                }
                const eventTarget: any = event.target // TODO: cast to any because value does not exist on all types of EventTarget, find better solution
                if (!eventTarget.value) {
                    util.logWarning('DirectDomAdapter::addKeypressListenerTo(..) event.target.value is not defined')
                    return
                }
                callback(eventTarget.value)
            }
        }
    }

    public async addChangeListenerTo<RETURN_TYPE>(id: string, returnField: 'value' | 'checked', callback: (value: RETURN_TYPE) => void): Promise<void> {
        this.getElementOrFail(id).onchange = (event) => {
            //console.log(event)
            if (!event.target) {
                util.logWarning('DirectDomAdapter::addChangeListenerTo(..) event.target is null')
                return
            }
            const eventTarget: any = event.target // TODO: cast to any because returnField does not exist on all types of EventTarget, find better solution
            if (!eventTarget[returnField]) {
                util.logWarning(`DirectDomAdapter::addChangeListenerTo(..) event.target.${returnField} is not defined`)
                return
            }
            callback(eventTarget[returnField]);
        }
    }

    public async addWheelListenerTo(id: string, callback: (delta: number, clientX: number, clientY: number) => void): Promise<void> {
        this.getElementOrFail(id).onwheel = (event) => {
            //console.log(event)
            callback(event.deltaY, event.clientX, event.clientY)
        }
    }

    public async addEventListenerAdvancedTo(id: string, eventType: MouseEventType, options: { stopPropagation?: boolean | undefined; }, callback: (result: MouseEventResultAdvanced) => void): Promise<void> {
        this.getElementOrFail(id)[this.prefixMouseEventTypeWithOn(eventType)] = (event) => {
            //console.log(event)
            if (options.stopPropagation) {
                event.stopPropagation()
            }
            if (!event.target) {
                util.logWarning('DirectDomAdapter::addEventListenerAdvancedTo(..) event.target is null')
                return
            }
            if (!(event.target instanceof Element)) {
                util.logWarning('DirectDomAdapter::addEventListenerAdvancedTo(..) event.target is not instance of Element')
                return
            }
            const cursor: string = window.getComputedStyle(event.target)["cursor"]
            if (!['auto','default','pointer','grab','ns-resize','ew-resize','nwse-resize'].includes(cursor)) { // TODO: use something for type that also works at runtime (e.g. enum)
                util.logWarning(`DirectDomAdapter::addEventListenerAdvancedTo(..) cursor is not known`)
            }
            callback({
                position: new ClientPosition(event.clientX, event.clientY), 
                ctrlPressed: event.ctrlKey, 
                cursor: cursor as ('auto'|'default'|'pointer'|'grab'|'ns-resize'|'ew-resize'|'nwse-resize') // TODO: remove cast as soon as typing is improved
            })
        }
    }

    public async addEventListenerTo(id: string, eventType: MouseEventType, callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void): Promise<void> {
        this.getElementOrFail(id)[this.prefixMouseEventTypeWithOn(eventType)] = (event) => {
            //console.log(event)
            event.stopPropagation()
            callback(event.clientX, event.clientY, event.ctrlKey)
        }
    }

    public async addDragListenerTo(id: string, eventType: DragEventType, callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void): Promise<void> {
        this.getElementOrFail(id)[this.prefixDragEventTypeWithOn(eventType)] = (event) => {
            //console.log(event)
            event.stopPropagation()
            if (eventType === 'dragstart') {
                if (!event.dataTransfer) {
                    util.logWarning(`DirectDomAdapter::addDragListenerTo(..) event.dataTransfer is null, cannot setDragImage to not appear.`)
                } else {
                    event.dataTransfer.setDragImage(new Image(), 0, 0)
                }
            }
            if (event.clientX != 0 || event.clientY != 0) {
                callback(event.clientX, event.clientY, event.ctrlKey)
            }
        }
    }

    public async removeEventListenerFrom(id: string, eventType: EventType): Promise<void> {
        this.getElementOrFail(id)[this.prefixEventTypeWithOn(eventType)] = null
    }
    
    private prefixMouseEventTypeWithOn(eventType: MouseEventType): 'onclick'|'oncontextmenu'|'onmousedown'|'onmouseup'|'onmousemove'|'onmouseover'|'onmouseout'|'onmouseenter'|'onmouseleave' {
        return 'on'+eventType as any
    }

    private prefixDragEventTypeWithOn(eventType: DragEventType): 'ondragstart'|'ondrag'|'ondragend'|'ondragenter' {
        return 'on'+eventType as any
    }

    private prefixEventTypeWithOn(eventType: EventType): 
        'onclick'|'oncontextmenu'|'onmousedown'|'onmouseup'|'onmousemove'|'onmouseover'|'onmouseout'|'onmouseenter'|'onmouseleave'
        |'ondragstart'|'ondrag'|'ondragend'|'ondragenter'|'onwheel'|'onchange'
    {
        return 'on'+eventType as any
    }
    
    public getIpcChannelsCount(): number {
        return 0
    }

}