import { style } from '../styleAdapter'
import { renderManager } from '../RenderManager'
import { Widget } from '../Widget'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'
import { MenuItemWidget } from './MenuItemWidget'
import * as menuItemWidgetFactory from './menuItemWidgetFactory'
import { util } from '../util'

export class MenuItemFolderContainerWidget extends Widget {

    private readonly id: string
    private readonly menuItems: (MenuItemFile|MenuItemFolder)[]
    private menuItemWidgets: MenuItemWidget<MenuItemFile|MenuItemFolder>[] | undefined
    private ongoingUnrender: Promise<void> = Promise.resolve()

    public constructor(id: string, menuItems: (MenuItemFile|MenuItemFolder)[]) {
        super()
        this.id = id
        this.menuItems = menuItems
    }

    public getId(): string {
        return this.id
    }

    private isRendered(): boolean {
        return !!this.menuItemWidgets
    }

    public async render(): Promise<void> {
        if (this.isRendered()) {
            return Promise.resolve()
        }
        renderManager.addClassTo(this.getId(), style.getApplicationMenuClass('ItemFolderContainer'))

        this.menuItemWidgets = this.menuItems.map(item => menuItemWidgetFactory.of(item))

        let html = this.menuItemWidgets.map(widget => `<div id="${widget.getId()}"></div>`).join('')
        await renderManager.setContentTo(this.getId(), html)

        await Promise.all(this.menuItemWidgets.map(widget => widget.render()))
    }

    public async unrender(): Promise<void> {
        if (!this.isRendered()) {
            return this.ongoingUnrender // prevents parent widget from removing this widget before ongoing unrender is completed
        }

        this.ongoingUnrender = this.unrenderExecute()
        await this.ongoingUnrender
    }

    private async unrenderExecute(): Promise<void> {
        if (!this.menuItemWidgets) {
            util.logWarning('menuItemWidgets is not set, this should be impossible at this state')
            return
        }

        const menuItemWidgetsToUnrender: MenuItemWidget<MenuItemFile|MenuItemFolder>[] = this.menuItemWidgets
        this.menuItemWidgets = undefined

        await Promise.all(menuItemWidgetsToUnrender.map(widget => widget.unrender()))
        await renderManager.setContentTo(this.getId(), '')
    }
    
}