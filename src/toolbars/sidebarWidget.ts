import { renderManager } from '../RenderManager'
import { ToolbarWidget } from './ToolbarWidget'
import * as indexHtmlIds from '../indexHtmlIds'
import { settingsOnStartup } from '../Settings'

const id = 'sidebar'

export const sidebarWidget = new ToolbarWidget(id)

export async function init(): Promise<void> {
  await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${id}" style="display:none;"></div>`)

  const settings = await settingsOnStartup
  settings.subscribeBoolean('sidebar', async (active: boolean) => updateRender(active))
  await updateRender(settings.getBoolean('sidebar'))
}

async function updateRender(active: boolean): Promise<void> {
  if (active) {
    await render()
  } else {
    await unrender()
  }
}

async function render(): Promise<void> {
  await Promise.all([
    renderManager.setStyleTo(id, 'position:absolute;top:0;right:0;height:100%;width:20%;background-color:#303438;'),
    sidebarWidget.render()
  ])
}

async function unrender(): Promise<void> {
  await Promise.all([
    renderManager.setStyleTo(id, 'display:none;'),
    sidebarWidget.unrender()
  ])
}
