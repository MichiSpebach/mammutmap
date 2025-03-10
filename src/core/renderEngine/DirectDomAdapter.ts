import { BatchMethod, CursorStyle, cursorStyles, DocumentObjectModelAdapter, DragEventType, EventListenerCallback, EventType, MouseEventResultAdvanced, MouseEventType } from './domAdapter'
import { RenderElements, RenderElement, Style } from './RenderElement'
import { EventListenerHandle, EventListenerRegister } from './EventListenerRegister'
import { stylesToCssText } from './util'

// TODO: reschedule all methods that return a Promise so that they are queued and priorized on heavy load to prevent lags
export class DirectDomAdapter implements DocumentObjectModelAdapter {
    private latestCursorClientPosition: {x: number, y: number}|undefined = undefined
    private eventListeners: EventListenerRegister = new EventListenerRegister()

    public constructor() {
        document.addEventListener(
            'mousemove',
            (event: MouseEvent) => this.latestCursorClientPosition = {x: event.clientX, y: event.clientY},
            {capture: true} // capture instead of bubble phase to prevent event from being stopPropagated before updating latestCursorClientPosition
        )
    }

    public openDevTools(): void {
        console.warn('DirectDomAdapter::openDevTools() not implemented, simply open it with browser. F12 or ctrl+shift+i on most browsers.')
    }

    public openWebLink(webLink: string): void {
        window.open(webLink)
    }

    public getClientSize(): { width: number; height: number; } {
        return {width: window.screen.width, height: window.screen.height}
    }
    
    public getCursorClientPosition(): { x: number; y: number; } {
        if (!this.latestCursorClientPosition) {
            console.warn(`DirectDomAdapter::getCursorClientPosition() latestCursorClientPosition is undefined, defaulting to {x: 0, y: 0}.`)
            return {x: 0, y: 0}
        }
        return this.latestCursorClientPosition
    }

    public getElementOrFail(id: string): HTMLElement|never {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            const message: string = `DirectDomAdapter::getElementOrFail(id: string) failed to get element with id '${id}'.`
            console.error(message)
            throw new Error(`DirectDomAdapter::getElementOrFail(id: string) failed to get element with id '${id}'.`)
        }
        return element
    }

    public getElement(id: string): HTMLElement|null {
        return document.getElementById(id)
    }

    public async isElementHovered(id: string): Promise<boolean> {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::isElementHovered(..) failed to get element with id '${id}', defaulting to false.`)
            return false
        }
        return element.matches(":hover")
    }

    public async getClientRectOf(id: string): Promise<DOMRect> {
        return this.getElementOrFail(id).getBoundingClientRect()
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
                    return this.setContentToSync(command.elementId, command.value as string)
                
                case 'removeElement':
                    return this.removeSync(command.elementId)

                case 'setStyleTo':
                    return this.setStyleToSync(command.elementId, command.value as string|Style)
        
                case 'addStyleTo':
                    return this.addStyleToSync(command.elementId, command.value as Style)
        
                case 'addClassTo':
                    return this.addClassToSync(command.elementId, command.value as string)
        
                case 'removeClassFrom':
                    return this.removeClassFromSync(command.elementId, command.value as string)
        
                default:
                    console.warn(`Method of batchCommand '${command.method}' not known.`)
                    return
            }
        })
        await Promise.all(pros)
    }

    public async appendChildTo(parentId: string, childId: string): Promise<void> {
        this.appendChildToSync(parentId, childId)
    }
    public appendChildToSync(parentId: string, childId: string): void {
        const parent: HTMLElement|null = this.getElement(parentId)
        const child: HTMLElement|null = this.getElement(childId)
        if (!parent) {
            console.warn(`DirectDomAdapter::appendChildTo(..) failed to get parent element with id '${parentId}'.`)
            return
        }
        if (!child) {
            console.warn(`DirectDomAdapter::appendChildTo(..) failed to get child element with id '${childId}'.`)
            return
        }
        parent.appendChild(child)
    }

    public async addContentTo(id: string, content: string): Promise<void> {
        this.addContentToSync(id, content)
    }
    public addContentToSync(id: string, content: string): void {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::addContentTo(..) failed to get element with id '${id}'.`)
            return
        }
        const temp = document.createElement("template")
        temp.innerHTML = content
        element.append(temp.content)
    }

    public async addElementsTo(id: string, elements: RenderElements): Promise<void> {
        this.addElementsToSync(id, elements)
    }
    private addElementsToSync(id: string, elements: RenderElements): void {
        const parent: HTMLElement|null = this.getElement(id)
        if (!parent) {
            console.warn(`DirectDomAdapter::addElementsTo(..) failed to get element with id '${id}'.`)
            return
        }
        parent.append(...this.createHtmlElementsFrom(elements))
    }

    public async addElementTo(id: string, element: RenderElement): Promise<void> {
        this.addElementToSync(id, element)
    }
    private addElementToSync(id: string, element: RenderElement): void {
        const parent: HTMLElement|null = this.getElement(id)
        if (!parent) {
            console.warn(`DirectDomAdapter::addElementTo(..) failed to get element with id '${id}'.`)
            return
        }
        parent.append(...this.createHtmlElementsFrom(element))
    }

    public async setElementsTo(id: string, elements: RenderElements): Promise<void> {
        this.setElementsToSync(id, elements)
    }
    public setElementsToSync(id: string, elements: RenderElements): void {
        const elementToSetInto: HTMLElement|null = this.getElement(id)
        if (!elementToSetInto) {
            console.warn(`DirectDomAdapter::setElementsTo(..) failed to get element with id '${id}'.`)
            return
        }
        elementToSetInto.innerHTML="" // TODO: is there no set(element) method?
        elementToSetInto.append(...this.createHtmlElementsFrom(elements))
    }

    public async setElementTo(id: string, element: RenderElement): Promise<void> {
        this.setElementToSync(id, element)
    }
    public setElementToSync(id: string, element: RenderElement): void {
        const elementToSetInto: HTMLElement|null = this.getElement(id)
        if (!elementToSetInto) {
            console.warn(`DirectDomAdapter::setElementTo(..) failed to get element with id '${id}'.`)
            return
        }
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

        const {
            type: elementType, 
            children: elementChildren, 
            ...assignableElementFields
        } = element // otherwise TypeError: Cannot set property children of #<Element> which has only a getter

        let node: HTMLElement|SVGElement
        if (element.type === 'svg' || element.type === 'polyline') {
            node = document.createElementNS('http://www.w3.org/2000/svg', elementType)
            if (assignableElementFields.viewBox) {
                node.setAttribute('viewBox', assignableElementFields.viewBox)
                delete assignableElementFields.viewBox
            }
            if (assignableElementFields.preserveAspectRatio) {
                node.setAttribute('preserveAspectRatio', assignableElementFields.preserveAspectRatio)
                delete assignableElementFields.preserveAspectRatio
            }
            if (assignableElementFields.points) {
                node.setAttribute('points', assignableElementFields.points)
                delete assignableElementFields.points
            }
        } else {
            node = document.createElement(elementType)
        }

        Object.assign(node, assignableElementFields)
        if (element.style) {
            Object.assign(node.style, element.style)
        }
        if (element.onclick) {
            this.setHtmlElementOnClick(node, element.onclick)
        }
        if (element.onchangeValue && element.onchangeChecked) {
            console.warn(`DirectDomAdapter::createHtmlElementFrom(..) multiple onchange event handlers for element with id '${element.id}', only one will work.`)
        }
        if (element.onchangeValue) {
            this.setHtmlElementOnChangeValue(node, element.onchangeValue)
        }
        if (element.onchangeChecked) {
            this.setHtmlElementOnChangeChecked(node, element.onchangeChecked)
        }
        // TODO: warn if element.attributes.on... event handler is not implemented yet

        if (elementChildren) {
            node.append(...this.createHtmlElementsFrom(elementChildren))
        }

        return node
    }

    private setHtmlElementOnClick(node: HTMLElement|SVGElement, onclick: (clientX: number, clientY: number, ctrlPressed: boolean) => void) {
        node.onclick = (event) => onclick(event.clientX, event.clientY, event.ctrlKey)
    }

    private setHtmlElementOnChangeValue(node: HTMLElement|SVGElement, onchangeValue: (value: string) => void): void {
        node.onchange = (event) => {
            if (!event.target) {
                let message: string = `DirectDomAdapter::setHtmlElementOnChangeValue(..) failed to process onchange event on element with id '${node.id}'`
                message += ', event.target is undefined, defaulting to empty string.'
                console.warn(message)
                onchangeValue('')
                return
            }
            const value: string|undefined = (event.target as any).value
            if (!value) {
                let message: string = `DirectDomAdapter::setHtmlElementOnChangeValue(..) failed to process onchange event on element with id '${node.id}'`
                message += ', event.target.value is undefined, defaulting to empty string.'
                console.warn(message)
                onchangeValue('')
                return
            }
            onchangeValue(value)
        }
    }

    private setHtmlElementOnChangeChecked(node: HTMLElement|SVGElement, onchangeChecked: (checked: boolean) => void): void {
        node.onchange = (event) => {
            if (!event.target) {
                let message: string = `DirectDomAdapter::setHtmlElementOnChangeChecked(..) failed to process onchange event on element with id '${node.id}'`
                message += ', event.target is undefined, defaulting to false.'
                console.warn(message)
                onchangeChecked(false)
                return
            }
            const checked: boolean|undefined = (event.target as any).checked
            if (checked === undefined) {
                let message: string = `DirectDomAdapter::setHtmlElementOnChangeChecked(..) failed to process onchange event on element with id '${node.id}'`
                message += ', event.target.checked is undefined, defaulting to false.'
                console.warn(message)
                onchangeChecked(false)
                return
            }
            onchangeChecked(checked)
        }
    }

    public async setContentTo(id: string, content: string): Promise<void> {
        this.setContentToSync(id, content)
    }
    public setContentToSync(id: string, content: string): void {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::setContentTo(..) failed to get element with id '${id}'.`)
            return
        }
        element.innerHTML=content
    }

    public async clearContentOf(id: string): Promise<void> {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::clearContentOf(..) failed to get element with id '${id}'.`)
            return
        }
        element.innerHTML = ''
    }

    public async remove(id: string): Promise<void> {
        this.removeSync(id)
    }
    public removeSync(id: string): void {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::remove(..) failed to get element with id '${id}'.`)
            return
        }
        element.remove()
    }

    public async setStyleTo(id: string, style: string|Style): Promise<void> {
        this.setStyleToSync(id, style)
    }
    public setStyleToSync(id: string, style: string|Style): void {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::setStyleTo(..) failed to get element with id '${id}'.`)
            return
        }
        if (typeof style === 'string') {
            element.style.cssText = style
        } else {
            element.style.cssText = ''
            Object.assign(element.style, style)
        }
    }

    public async addStyleTo(id: string, style: Style): Promise<void> {
        this.addStyleToSync(id, style)
    }
    public addStyleToSync(id: string, style: Style): void {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::addStyleTo(..) failed to get element with id '${id}'.`)
            return
        }
        Object.assign(element.style, style)
    }

    public async addClassTo(id: string, className: string): Promise<void> {
        this.addClassToSync(id, className)
    }
    public addClassToSync(id: string, className: string): void {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::addClassTo(..) failed to get element with id '${id}'.`)
            return
        }
        element.classList.add(className)
    }

    public async removeClassFrom(id: string, className: string): Promise<void> {
        this.removeClassFromSync(id, className)
    }
    public removeClassFromSync(id: string, className: string): void {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::removeClassFrom(..) failed to get element with id '${id}'.`)
            return
        }
        element.classList.remove(className)
    }

    public async containsClass(id: string, className: string): Promise<boolean> {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::containsClass(..) failed to get element with id '${id}', defaulting to false.`)
            return false
        }
        return element.classList.contains(className)
    }

    public async getClassesOf(id: string): Promise<string[]> {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::getClassesOf(..) failed to get element with id '${id}', defaulting to empty list.`)
            return []
        }
        const classNames: string[] = []
        element.classList.forEach(className => classNames.push(className))
        return classNames
    }

    public async addStyleSheet(styleSheet: {[ruleName: string]: Style}): Promise<void> {
        const cssStyleSheet = new CSSStyleSheet()
        cssStyleSheet.replace(stylesToCssText(styleSheet))
        document.adoptedStyleSheets.push(cssStyleSheet)
    }

    public modifyCssRule(cssRuleName: string, propertyName: string, propertyValue: string): Promise<{ propertyValueBefore: string; }> {
        throw new Error('DirectDomAdapter::modifyCssRule(..) not implemented yet.');
    }
    
    public async getValueOf(id: string): Promise<string> {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::getValueOf(..) failed to get element with id '${id}', defaulting to empty string.`)
            return ''
        }
        return (element as any).value // TODO: cast to any because value does not exist on all types of HTMLElement, find better solution
    }

    public async setValueTo(id: string, value: string): Promise<void> {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::setValueTo(..) failed to get element with id '${id}'.`)
            return
        }
        (element as any).value = value // TODO: cast to any because value does not exist on all types of HTMLElement, find better solution
    }

    public async getCheckedOf(id: string): Promise<boolean> {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::getCheckedOf(..) failed to get element with id '${id}', defaulting to false.`)
            return false
        }
        return (element as any).checked // TODO: cast to any because checked does not exist on all types of HTMLElement, find better solution
    }

    public async setCheckedTo(id: string, checked: boolean): Promise<void> {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::setCheckedTo(..) failed to get element with id '${id}'.`)
            return
        }
        (element as any).checked = checked // TODO: cast to any because checked does not exist on all types of HTMLElement, find better solution
    }

    public async scrollToBottom(id: string): Promise<void> {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::scrollToBottom(..) failed to get element with id '${id}'.`)
            return
        }
        element.scrollBy(0, 1000*1000) // things like Number.MAX_SAFE_INTEGER don't work on all browsers
    }

    public async addKeydownListenerTo(id: string, key: 'Enter'|'Escape', callback: (targetValue: string|undefined) => void): Promise<void> {
        this.addAndRegisterEventListener(id, {
            type: 'keydown', 
            listener: callback, 
            nativeListener: (event: KeyboardEvent) => {
                //console.log(event)
                if (event.key === key) {
                    if (!event.target) {
                        console.warn('DirectDomAdapter::addKeydownListenerTo(..) event.target is null')
                        return
                    }
                    const eventTarget: any = event.target // TODO: cast to any because value does not exist on all types of EventTarget, find better solution
                    callback(eventTarget.value)
                }
            }
        })
    }

    public async addChangeListenerTo<RETURN_TYPE>(id: string, returnField: 'value' | 'checked', callback: (value: RETURN_TYPE) => void): Promise<void> {
        this.addAndRegisterEventListener(id, {
            type: 'change', 
            listener: callback, 
            nativeListener: (event: Event) => {
                //console.log(event)
                if (!event.target) {
                    console.warn('DirectDomAdapter::addChangeListenerTo(..) event.target is null')
                    return
                }
                const eventTarget: any = event.target // TODO: cast to any because returnField does not exist on all types of EventTarget, find better solution
                if (returnField === 'value' && !eventTarget.value) {
                    console.warn(`DirectDomAdapter::addChangeListenerTo(..) event.target.value is not defined`)
                    return
                }
                callback(eventTarget[returnField]);
            }
        })
    }

    public async addWheelListenerTo(id: string, callback: (delta: number, clientX: number, clientY: number) => void): Promise<void> {
        this.addAndRegisterEventListener(id, {
            type: 'wheel', 
            listener: callback, 
            nativeListener: (event: WheelEvent) => {
                //console.log(event)
                callback(event.deltaY, event.clientX, event.clientY)
            }
        })
    }

    public async addEventListenerAdvancedTo(
        id: string,
        eventType: MouseEventType,
        options: {stopPropagation: boolean, capture?: boolean},
        callback: (result: MouseEventResultAdvanced) => void
    ): Promise<void> {
        this.addAndRegisterEventListener(id, {
            type: eventType, 
            capture: options.capture, 
            listener: callback, 
            nativeListener: (event: MouseEvent) => {
                //console.log(event)
                if (options.stopPropagation) {
                    event.stopPropagation()
                }
                if (eventType === 'contextmenu') {
                    event.preventDefault()
                }
                if (!event.target) {
                    console.warn('DirectDomAdapter::addEventListenerAdvancedTo(..) event.target is null')
                    return
                }
                if (!(event.target instanceof Element)) {
                    console.warn('DirectDomAdapter::addEventListenerAdvancedTo(..) event.target is not instance of Element')
                    return
                }
                const cursor: string = window.getComputedStyle(event.target)["cursor"]
                if (!cursorStyles.includes(cursor as CursorStyle)) {
                    console.warn(`DirectDomAdapter::addEventListenerAdvancedTo(..) cursor '${cursor}' is not known`)
                }
                const targetPathElementIds: string [] = []
                for (let targetPathElement: Element|null = event.target; targetPathElement; targetPathElement = targetPathElement.parentElement) {
                    targetPathElementIds.unshift(targetPathElement.id)
                }
                callback({
                    clientPosition: {x: event.clientX, y: event.clientY}, 
                    ctrlPressed: event.ctrlKey, 
                    cursor: cursor as CursorStyle,
                    targetPathElementIds
                })
            }
        })
    }

    public async addEventListenerTo(
        id: string, 
        eventType: MouseEventType, 
        callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void
    ): Promise<void> {
        this.addAndRegisterEventListener(id, {
            type: eventType, 
            listener: callback, 
            nativeListener: (event: MouseEvent): void => {
                //console.log(event)
                event.stopPropagation()
                if (eventType === 'contextmenu') {
                    event.preventDefault()
                }
                callback(event.clientX, event.clientY, event.ctrlKey)
            }
        })
    }

    public async addDragListenerTo(id: string, eventType: DragEventType, callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void): Promise<void> {
        this.addAndRegisterEventListener(id, {
            type: eventType, 
            listener: callback, 
            nativeListener: (event: DragEvent): void => {
                //console.log(event)
                event.stopPropagation()
                if (eventType === 'dragstart') {
                    if (!event.dataTransfer) {
                        console.warn(`DirectDomAdapter::addDragListenerTo(..) event.dataTransfer is null, cannot setDragImage to not appear.`)
                    } else {
                        event.dataTransfer.setDragImage(new Image(), 0, 0)
                    }
                }
                if (eventType === 'dragover') {
                    event.preventDefault() // removes forbidden cursor
                }
                if (event.clientX !== 0 || event.clientY !== 0) {
                    if (eventType === 'dragstart') {
                        // reschedule because otherwise 'dragend' would fire immediately if callback does dom operations in the same cycle
                        setTimeout(() => callback(event.clientX, event.clientY, event.ctrlKey))
                    } else {
                        callback(event.clientX, event.clientY, event.ctrlKey)
                    }
                }
            }
        })
    }

    private addAndRegisterEventListener(id: string, listener: EventListenerHandle): void {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::addAndRegisterEventListener(..) failed to get element with id '${id}', eventType is '${listener.type}'.`)
            return
        }
        this.eventListeners.add(id, listener)
        element.addEventListener(listener.type, listener.nativeListener, listener.capture)
    }

    public async removeEventListenerFrom(id: string, eventType: EventType, listener?: EventListenerCallback): Promise<void> {
        const element: HTMLElement|null = this.getElement(id)
        if (!element) {
            console.warn(`DirectDomAdapter::removeEventListenerFrom(..) failed to get element with id '${id}'.`)
            return
        }
        const handle: EventListenerHandle = this.eventListeners.pop(id, eventType, listener)
        element.removeEventListener(eventType, handle.nativeListener, handle.capture)
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