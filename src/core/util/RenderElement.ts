// TODO: create folder/module rendering and move RenderElement.ts, renderManager.ts, domAdapter.ts into there
export {
  createRenderElement as ce,
  createRenderElement as cre,
  createRenderElement as createElement
}

export function createRenderElement(renderElement: RenderElement): RenderElement {
  return renderElement
}

export function createRenderElementRaw(type: string, attributes: any, children: any): RenderElement {
  return {type: type as ElementType, ...attributes, children}
}

export function concatRenderElements(elementsList: RenderElements[]): RenderElements {
  return elementsList.flat()
}

export type RenderElements = string | RenderElement | (string|RenderElement)[]

export type RenderElement = {
  type: ElementType,
  id?: string,
  style?: Style,
  className?: string,
  selected?: boolean,
  innerHTML?: string,
  onclick?: (clientX: number, clientY: number, ctrlPressed: boolean) => void,
  value?: string,
  onchangeValue?: (value: string) => void,
  onchangeChecked?: (checked: boolean) => void
  children?: RenderElements
}

export type ElementType = 'div'|'span'|'table'|'tr'|'td'|'button'|'select'|'option'

export type Style = {
  position?: string,
  left?: string,
  right?: string,
  top?: string,
  bottom?: string,
  width?: string,
  height?: string
  color?: string
}

export class RenderElementClass implements RenderElement {
  public constructor(
    public type: ElementType,
    public attributes: any, // TODO: flatten attributes, inline them
    public children: (string | RenderElement)[]
  ) {}
}
