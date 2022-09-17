import { renderManager } from '../RenderManager'
import { ToolbarWidget } from './ToolbarWidget'
import * as indexHtmlIds from '../indexHtmlIds'

const id = 'sidebar'

export const sidebarWidget = new ToolbarWidget(id)

export async function init(): Promise<void> {
  const style = 'position:absolute;top:0;right:0;height:100%;width:20%;background-color:#303438;'
  await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${id}" style="${style}"></div>`)
  await sidebarWidget.render()
}
