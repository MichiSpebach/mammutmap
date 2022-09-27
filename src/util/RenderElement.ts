
type ElementType = 'div'|'span'|'button'|'select'|'option'
type ElementAttributeType = 'id'|'style'|'onclick'
type ElementAttribute = {key: ElementAttributeType, value: any}

export function ce(type: ElementType, attributes: any, children: (string|RenderElement)[]): RenderElement {
  return createElement(type, attributes, children)
}

// TODO: improve typesafety
export function createElement(type: ElementType, attributes: any, children: (string|RenderElement)[]): RenderElement {
  return {type, attributes, children}
}

export function createElementRaw(type: string, attributes: any, children: any): RenderElement {
  return {type: type as ElementType, attributes, children}
}

export type RenderElement = {
  type: ElementType,
  attributes: any,
  children: (string|RenderElement)[]
}

export class RenderElementClass implements RenderElement {
  public constructor(
    public type: ElementType,
    public attributes: any,
    public children: (string | RenderElement)[]
  ) {}
}

export type RenderElementLike = string|RenderElement|RenderElement[]
