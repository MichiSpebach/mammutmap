import { ApplicationMenu } from './applicationMenu'
import { MenuItem } from 'electron'
import * as indexHtmlIds from '../indexHtmlIds'
import { renderManager } from '../RenderManager'
import { HtmlApplicationMenuWidget } from './HtmlApplicationMenuWidget'

export class HtmlApplicationMenu extends ApplicationMenu {

    private readonly widget: HtmlApplicationMenuWidget

    public constructor() {
        super()
        this.widget = new HtmlApplicationMenuWidget('htmlApplicationMenu')
    }

    public async initAndRender(): Promise<void> {
        const style = 'position:fixed;top:0;'
        await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${this.widget.getId()}" style="${style}"></div>`)
        await this.widget.render()
    }
  
    public addMenuItemToPlugins(menuItem: MenuItem): void {
      // TODO
    }
  
    public addMenuItemTo(parentMenuItemId: string, menuItem: MenuItem): void {
      // TODO
    }
    
  }