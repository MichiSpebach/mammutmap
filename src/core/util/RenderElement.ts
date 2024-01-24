// TODO: create folder/module rendering and move RenderElement.ts, renderManager.ts, domAdapter.ts into there

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
  title?: string,
  onclick?: (clientX: number, clientY: number, ctrlPressed: boolean) => void,
  onmouseenter?: (clientX: number, clientY: number, ctrlPressed: boolean) => void,
  onmouseleave?: (clientX: number, clientY: number, ctrlPressed: boolean) => void,
  value?: string,
  onchangeValue?: (value: string) => void,
  onchangeChecked?: (checked: boolean) => void
  children?: RenderElements
}

export type ElementType = 'div'|'span'|'table'|'tr'|'td'|'ul'|'li'|'pre'|'button'|'input'/*|'checkbox' TODO map to <input type="checkbox">*/|'select'|'option'

/**
 * when adding/amending Style to an Element:
 * undefined means letting it like it is, like not mentioning it
 * null means removing a style property
 */
export type Style = {
  [key in keyof CSSStyleDeclaration]?: string|null
} & {
  display?: 'block'|'inline'|'inline-block'|'flex'|'none'|null // TODO: use something that comes with stricter typing and cleanup overriding
  position?: 'static'|'absolute'|'fixed'|'relative'|'sticky'|'initial'|'inherit'|null // without overriding any strings would be allowed
  float?: 'left'|'right'|'none'|'inherit'|null
  pointerEvents?: 'auto'|'none'|'stroke'|null
  top?: '0'|`${number}px`|`${number}%`
}
