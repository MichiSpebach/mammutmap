import { MenuItem } from './MenuItem'
import { MenuItemFolder } from './MenuItemFolder'
import * as indexHtmlIds from '../indexHtmlIds'
import { renderManager } from '../RenderManager'
import { HtmlApplicationMenuWidget } from './HtmlApplicationMenuWidget'
import { AbstractApplicationMenu, ApplicationMenuOptions } from './applicationMenu'

export class HtmlApplicationMenu extends AbstractApplicationMenu {

    private readonly widget: HtmlApplicationMenuWidget

    private rendered: boolean = false
    private ongoingRender: Promise<void>|undefined = undefined
    private ongoingUnrender: Promise<void>|undefined = undefined

    public constructor(options?: ApplicationMenuOptions) {
        super(options)
        this.widget = new HtmlApplicationMenuWidget('htmlApplicationMenu', this.menuTree)
    }

    public async initAndRender(): Promise<void> {
        await this.renderUp()
    }

    public async renderUp(): Promise<void> {
        if (this.rendered) {
            return
        }
        if (this.ongoingRender) {
            return this.ongoingRender
        }

        this.ongoingRender = this.render()

        await this.ongoingRender
        this.ongoingRender = undefined
        this.rendered = true
    }
    
    private async render(): Promise<void> {
        const style = 'position:fixed;top:0;'
        await renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${this.widget.getId()}" style="${style}"></div>`)
        await this.widget.render()
    }

    public async renderDown(): Promise<void> {
        if (!this.rendered) {
            return
        }
        if (this.ongoingUnrender) {
            return this.ongoingUnrender
        }

        this.ongoingUnrender = this.unrender()

        await this.ongoingUnrender
        this.ongoingUnrender = undefined
        this.rendered = false
    }
    
    private async unrender(): Promise<void> {
        await this.widget.unrender()
        await renderManager.remove(this.widget.getId())
    }

    public async addMenuItemToAfter(parentMenuItem: MenuItemFolder, menuItem: MenuItem): Promise<void> {
        // TODO implement for case that parentMenuItem is opened at the moment
    }

    public async setMenuItemEnabledAfter(menuItem: MenuItem, enabled: boolean): Promise<void> {
        // TODO implement for case that parentMenuItem is opened at the moment
    }

}
