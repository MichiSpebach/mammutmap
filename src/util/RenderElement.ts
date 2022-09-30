// TODO: create folder/module rendering and move RenderElement.ts, renderManager.ts, domAdapter.ts into there
export {
  createRenderElement as ce,
  createRenderElement as cre,
  createRenderElement as createElement
}

export function createRenderElement(type: ElementType, attributes: ElementAttributes, children: (string|RenderElement)[]): RenderElement {
  return {type, attributes, children}
}

export function createRenderElementRaw(type: string, attributes: any, children: any): RenderElement {
  return {type: type as ElementType, attributes, children}
}

export type RenderElements = string | RenderElement | (string|RenderElement)[]

export type RenderElement = {
  type: ElementType,
  attributes: ElementAttributes,
  children: (string|RenderElement)[]
}

export type ElementType = 'div'|'span'|'button'|'select'|'option'

export type ElementAttributes = {
  id?: string,
  selected?: boolean,
  innerHTML?: string,
  onclick?: (clientX: number, clientY: number, ctrlPressed: boolean) => void,
  value?: string,
  onchangeValue?: (value: string) => void,
  onchangeChecked?: (checked: boolean) => void
}

export class RenderElementClass implements RenderElement {
  public constructor(
    public type: ElementType,
    public attributes: any,
    public children: (string | RenderElement)[]
  ) {}
}
