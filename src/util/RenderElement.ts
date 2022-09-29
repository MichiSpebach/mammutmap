
export function ce(type: ElementType, attributes: ElementAttributes, children: (string|RenderElement)[]): RenderElement {
  return createElement(type, attributes, children)
}

export function createElement(type: ElementType, attributes: ElementAttributes, children: (string|RenderElement)[]): RenderElement {
  return {type, attributes, children}
}

export function createElementRaw(type: string, attributes: any, children: any): RenderElement {
  return {type: type as ElementType, attributes, children}
}

export type RenderElementLike = string | RenderElement | (string|RenderElement)[] // TODO: rename to RenderElements

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
