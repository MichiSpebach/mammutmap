import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'
import * as indexHtmlIds from '../indexHtmlIds'
import { renderManager } from '../RenderManager'
import { HtmlApplicationMenuWidget } from './HtmlApplicationMenuWidget'

export class HtmlApplicationMenu {

    private readonly menuTree: MenuItemFolder
    private readonly widget: HtmlApplicationMenuWidget

    public constructor(menuTree: MenuItemFolder) {
        this.menuTree = menuTree
        this.widget = new HtmlApplicationMenuWidget('htmlApplicationMenu', this.menuTree)
    }

    public async initAndRender(): Promise<void> {
        const style = 'position:fixed;top:0;'
        await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${this.widget.getId()}" style="${style}"></div>`)
        await this.widget.render()
    }

    public addMenuItemTo(parentMenuItem: MenuItemFolder, menuItem: MenuItemFile|MenuItemFolder): void {
        // TODO implement for case that parentMenuItem is opened at the moment
    }

    public setMenuItemEnabled(menuItem: MenuItemFile|MenuItemFolder, enabled: boolean): Promise<void> {
        // TODO implement for case that parentMenuItem is opened at the moment
        return Promise.resolve()
    }

}
