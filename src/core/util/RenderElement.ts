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
  onclick?: (clientX: number, clientY: number, ctrlPressed: boolean) => void,
  onmouseenter?: (clientX: number, clientY: number, ctrlPressed: boolean) => void,
  onmouseleave?: (clientX: number, clientY: number, ctrlPressed: boolean) => void,
  value?: string,
  onchangeValue?: (value: string) => void,
  onchangeChecked?: (checked: boolean) => void
  children?: RenderElements
}

export type ElementType = 'div'|'span'|'table'|'tr'|'td'|'pre'|'button'|'input'|'select'|'option'

/**
 * when adding/amending Style to an Element:
 * undefined means letting it like it is, like not mentioning it
 * null means removing a style property
 */
export type Style = Partial<Record<keyof CSSStyleDeclaration, string>> & { // 'Record' because otherwise a string could be assigned (e.g.: 'const style: Style = "not a style object"')
  display?: 'block'|'inline'|'inline-block'|'flex'|'none' // TODO: use something that comes with stricter typing and cleanup overriding
  position?: 'static'|'absolute'|'fixed'|'relative'|'sticky'|'initial'|'inherit', // without overriding any strings would be allowed
  float?: 'left'|'right'|'none'|'inherit',
  pointerEvents?: 'auto'|'none'|'stroke',
} | {
  [key in keyof CSSStyleDeclaration]?: null
}
