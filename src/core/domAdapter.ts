import { RenderElement, RenderElements, Style } from './util/RenderElement'
import { ClientRect } from './ClientRect'
import { ClientPosition } from './shape/ClientPosition'

export type MouseEventType = 'click'|'dblclick'|'contextmenu'|'mousedown'|'mouseup'|'mousemove'|'mouseover'|'mouseout'|'mouseenter'|'mouseleave'
export type DragEventType = 'dragstart'|'drag'|'dragend'|'dragenter'|'dragover'
export type WheelEventType = 'wheel'
export type InputEventType = 'change'
export type KeyboardEventType = 'keydown'|'keyup'
export type EventType = MouseEventType|DragEventType|WheelEventType|InputEventType|KeyboardEventType

export type MouseEventListenerAdvancedCallback = (result: MouseEventResultAdvanced) => void
export type MouseEventListenerCallback = (clientX: number, clientY: number, ctrlPressed: boolean) => void
export type WheelEventListenerCallback = (delta: number, clientX: number, clientY: number) => void
export type ChangeEventListenerCallback = (value: any) => void
export type EventListenerCallback = MouseEventListenerAdvancedCallback|MouseEventListenerCallback|WheelEventListenerCallback|ChangeEventListenerCallback

export const cursorStyles = ['auto','default', 'text','pointer','grab','ns-resize','ew-resize','nwse-resize'] as const // "as const" makes CursorStyle a typesafe union of literals
export type CursorStyle = typeof cursorStyles[number]

export type MouseEventResultAdvanced = {
  position: ClientPosition,
  ctrlPressed: boolean,
  cursor: CursorStyle,
  targetPathElementIds: string[]
}

export type BatchMethod = 'appendChildTo'|'addContentTo'|'addElementsTo'|'addElementTo'|'setElementsTo'|'setElementTo'|'innerHTML'|'removeElement'|'setStyleTo'|'addStyleTo'|'addClassTo'|'removeClassFrom'

export let dom: DocumentObjectModelAdapter

export function init(object: DocumentObjectModelAdapter): void {
  dom = object
}

export interface DocumentObjectModelAdapter {

  openDevTools(): void
  openWebLink(webLink: string): void

  getClientSize(): {width: number, height: number}
  getCursorClientPosition(): {x: number, y: number}
  isElementHovered(id: string): Promise<boolean>
  getClientRectOf(id: string): Promise<ClientRect>

  batch(batch: {elementId: string, method: BatchMethod, value: string|Style|RenderElement|RenderElements}[]): Promise<void>

  appendChildTo(parentId: string, childId: string): Promise<void>
  addContentTo(id: string, content: string): Promise<void>
  addElementsTo(id: string, elements: RenderElements): Promise<void>
  addElementTo(id: string, element: RenderElement): Promise<void>
  setElementsTo(id: string, elements: RenderElements): Promise<void>
  setElementTo(id: string, element: RenderElement): Promise<void>
  setContentTo(id: string, content: string): Promise<void>
  clearContentOf(id: string): Promise<void>
  remove(id: string): Promise<void>

  setStyleTo(id: string, style: string|Style): Promise<void>
  addStyleTo(id: string, style: Style): Promise<void>
  addClassTo(id: string, className: string): Promise<void>
  removeClassFrom(id: string, className: string): Promise<void>
  containsClass(id: string, className: string): Promise<boolean>
  getClassesOf(id: string): Promise<string[]>
  addStyleSheet(styleSheet: {[ruleName: string]: Style}): Promise<void>
  modifyCssRule(cssRuleName: string, propertyName: string, propertyValue: string): Promise<{propertyValueBefore: string}>

  getValueOf(id: string): Promise<string>
  setValueTo(id: string, value: string): Promise<void>
  getCheckedOf(id: string): Promise<boolean>
  setCheckedTo(id: string, checked: boolean): Promise<void>

  scrollToBottom(id: string): Promise<void>

  addKeydownListenerTo(id: string, key: 'Enter', callback: (value: string) => void): Promise<void>

  addChangeListenerTo<RETURN_TYPE>(
    id: string,
    returnField: 'value'|'checked',
    callback: (value: RETURN_TYPE) => void
  ): Promise<void>

  addWheelListenerTo(id: string, callback: (delta: number, clientX: number, clientY: number) => void): Promise<void>

  addEventListenerAdvancedTo(
    id: string,
    eventType: MouseEventType,
    options: {stopPropagation: boolean, capture?: boolean},
    callback: (result: MouseEventResultAdvanced) => void
  ): Promise<void>

  addEventListenerTo(
    id: string,
    eventType: MouseEventType,
    callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void
  ): Promise<void>

  addDragListenerTo(
    id: string,
    eventType: DragEventType,
    callback: (clientX: number, clientY: number, ctrlPressed: boolean) => void
  ): Promise<void>

  removeEventListenerFrom(id: string, eventType: EventType, listener?: EventListenerCallback): Promise<void>

  getIpcChannelsCount(): number
}
