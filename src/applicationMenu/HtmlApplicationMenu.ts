import { ApplicationMenu } from './applicationMenu'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'
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
        return Promise.resolve() // TODO WIP
        const style = 'position:fixed;top:0;'
        await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${this.widget.getId()}" style="${style}"></div>`)
        await this.widget.render()
    }
  
    public addMenuItemToPlugins(menuItem: MenuItemFile|MenuItemFolder): void {
        // TODO
    }
  
    public addMenuItemTo(parentMenuItemId: string, menuItem: MenuItemFile|MenuItemFolder): void {
        // TODO
    }

    public setMenuItemEnabled(menuItem: MenuItemFile|MenuItemFolder, enabled: boolean): Promise<void> {
        // TODO
        return Promise.resolve()
    }
    
  }