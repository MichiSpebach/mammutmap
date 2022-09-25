
type ElementType = 'div'|'span'|'button'
type ElementAttributeType = 'id'|'style'|'onclick'
type ElementAttribute = {key: ElementAttributeType, value: any}

export function ce(type: ElementType, attributes: any, children: RenderElement[]): RenderElement {
  return createElement(type, attributes, children)
}

// TODO: improve typesafety
export function createElement(type: ElementType, attributes: any, children: RenderElement[]): RenderElement {
  return {type, attributes, children}
}

export function createElementRaw(type: string, attributes: any, children: any): RenderElement {
  return {type: type as ElementType, attributes, children}
}

export type RenderElement = {
  type: ElementType,
  attributes: any,
  children: RenderElement[]
}
