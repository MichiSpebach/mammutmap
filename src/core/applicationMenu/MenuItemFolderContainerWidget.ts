import { style } from '../styleAdapter'
import { renderManager } from '../renderEngine/renderManager'
import { Widget } from '../Widget'
import { MenuItem } from './MenuItem'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemWidget } from './MenuItemWidget'
import * as menuItemWidgetFactory from './menuItemWidgetFactory'
import { util } from '../util/util'

export class MenuItemFolderContainerWidget extends Widget {

    private readonly id: string
    private readonly menuItems: MenuItem[]
    private readonly closeMenu: () => Promise<void>
    private menuItemWidgets: MenuItemWidget<MenuItem>[] | undefined
    private ongoingUnrender: Promise<void> = Promise.resolve()

    public constructor(id: string, menuItems: MenuItem[], closeMenu: () => Promise<void>) {
        super()
        this.id = id
        this.menuItems = menuItems
        this.closeMenu = closeMenu
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

        this.menuItemWidgets = this.menuItems.map(item => menuItemWidgetFactory.of(item, this.closeMenu))
        if (this.menuItemWidgets.length === 0) {
            this.menuItemWidgets.push(menuItemWidgetFactory.of(new MenuItemFile({label: 'empty', enabled: false, click: () => {}}), this.closeMenu))
        }

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

        const menuItemWidgetsToUnrender: MenuItemWidget<MenuItem>[] = this.menuItemWidgets
        this.menuItemWidgets = undefined

        await Promise.all(menuItemWidgetsToUnrender.map(widget => widget.unrender()))
        await renderManager.setContentTo(this.getId(), '')
    }
    
}