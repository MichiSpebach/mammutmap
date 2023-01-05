import * as indexHtmlIds from './indexHtmlIds'
import { MouseEventResultAdvanced, renderManager, RenderPriority } from './RenderManager'

const id: string = 'htmlCursor'
let activated: boolean = false

export async function activate(): Promise<void> {
  if (activated) {
    return
  }
  activated = true

  await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${id}" style="${getStyle()}"></div>`)
  await renderManager.addEventListenerAdvancedTo(indexHtmlIds.bodyId, 'mousemove', {stopPropagation: false}, (eventResult: MouseEventResultAdvanced) => {
    update(eventResult.position.x, eventResult.position.y)
  })
}

export async function deactivate(): Promise<void> {
  if (!activated) {
    return
  }
  activated = false

  await renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mousemove')
  await renderManager.remove(id)
}

function getStyle(): string {
  const clipStyle: string = 'clip-path:polygon(0 0, 100% 66%, 39% 66%, 0 100%);'
  return 'position:fixed;width:15px;height:20px;background-color:white;pointer-events:none;'+clipStyle
}

async function update(clientX: number, clientY: number): Promise<void> {
  renderManager.setStyleTo(id, `${getStyle()}left:${clientX}px;top:${clientY}px;`, RenderPriority.RESPONSIVE)
}
