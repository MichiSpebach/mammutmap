import { renderManager } from '../RenderManager'
import { ToolbarWidget } from './ToolbarWidget'
import * as indexHtmlIds from '../indexHtmlIds'
import { settingsOnStartup } from '../Settings'

const id = 'sidebar'

export const sidebarWidget = new ToolbarWidget(id)

export async function init(): Promise<void> {
  await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${id}" style="${(await getStyle())}"></div>`);

  (await settingsOnStartup).subscribeBoolean('sidebar', async () => {
    await renderManager.setStyleTo(id, await getStyle())
  })

  await sidebarWidget.render()
}

async function getStyle(): Promise<string> {
  if ((await settingsOnStartup).getBoolean('sidebar')) {
    return 'position:absolute;top:0;right:0;height:100%;width:20%;background-color:#303438;'
  } else {
    return 'display:none;'
  }
}
