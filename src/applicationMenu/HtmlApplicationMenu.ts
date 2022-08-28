import { ApplicationMenu } from './ApplicationMenu'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'
import * as indexHtmlIds from '../indexHtmlIds'
import { renderManager } from '../RenderManager'
import { HtmlApplicationMenuWidget } from './HtmlApplicationMenuWidget'
import { util } from '../util'

export class HtmlApplicationMenu extends ApplicationMenu {

    private readonly widget: HtmlApplicationMenuWidget

    public constructor() {
        super()
        this.widget = new HtmlApplicationMenuWidget('htmlApplicationMenu', this.menuTree)
    }

    public async initAndRender(): Promise<void> {
        return Promise.resolve() // TODO WIP
        const style = 'position:fixed;top:0;'
        await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${this.widget.getId()}" style="${style}"></div>`)
        await this.widget.render()
    }

    public addMenuItemTo(parentMenuItemId: string, menuItem: MenuItemFile|MenuItemFolder): void {
        const parentMenuItem: MenuItemFolder|MenuItemFile|undefined = this.findMenuItemById(parentMenuItemId)
        if (!parentMenuItem) {
            util.logWarning(`Cannot add menuItem '${menuItem.label}' to menu with id '${parentMenuItem}' because it was not found.`)
            return
        }
        if (!(parentMenuItem instanceof MenuItemFolder)) {
            util.logWarning(`Cannot add menuItem '${menuItem.label}' to menu with id '${parentMenuItem}' because it is not a MenuItemFolder.`)
            return
        }

        parentMenuItem.submenu.push(menuItem)
    }

    public setMenuItemEnabled(menuItem: MenuItemFile|MenuItemFolder, enabled: boolean): Promise<void> {
        // TODO
        return Promise.resolve()
    }

  }
