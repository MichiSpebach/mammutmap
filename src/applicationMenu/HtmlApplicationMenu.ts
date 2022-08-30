import { ApplicationMenu } from './ApplicationMenu'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'
import * as indexHtmlIds from '../indexHtmlIds'
import { renderManager } from '../RenderManager'
import { HtmlApplicationMenuWidget } from './HtmlApplicationMenuWidget'

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

    protected afterAddMenuItemTo(parentMenuItem: MenuItemFolder, menuItem: MenuItemFile|MenuItemFolder): void {
        // TODO implement for case that parentMenuItem is opened at the moment
    }

    protected afterSetMenuItemEnabled(menuItem: MenuItemFile|MenuItemFolder, enabled: boolean): Promise<void> {
        // TODO implement for case that parentMenuItem is opened at the moment
        return Promise.resolve()
    }

  }
