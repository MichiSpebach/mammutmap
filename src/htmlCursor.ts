import * as indexHtmlIds from './indexHtmlIds'
import { renderManager, RenderPriority } from './RenderManager'

const id: string = 'htmlCursor'
let activated: boolean = false

export async function activate(): Promise<void> {
  if (activated) {
    return
  }
  activated = true

  const clipStyle: string = 'clip-path:polygon(0 0, 100% 66%, 39% 66%, 0 100%);'
  const style: string = 'position:fixed;width:15px;height:20px;background-color:white;pointer-events:none;'+clipStyle
  await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${id}" style="${style}"></div>`)
  await renderManager.addEventListenerTo(indexHtmlIds.bodyId, 'mousemove', (clientX: number, clientY: number) => {
    renderManager.setStyleTo(id, `${style}left:${clientX}px;top:${clientY}px;`, RenderPriority.RESPONSIVE)
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
