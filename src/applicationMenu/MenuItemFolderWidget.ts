import { renderManager } from '../RenderManager'
import { MenuItemWidget } from './MenuItemWidget'
import { MenuItemFolder } from './MenuItemFolder'
import * as menuItemWidgetFactory from './menuItemWidgetFactory'
import { MenuItemFile } from './MenuItemFile'

export class MenuItemFolderWidget extends MenuItemWidget<MenuItemFolder> {

    private submenuWidgets: MenuItemWidget<MenuItemFile|MenuItemFolder>[]|undefined

    protected formHtml(): string {
        return this.menuItem.label+'&gt;'
    }

    protected async afterRender(): Promise<void> {
        await Promise.all([
            renderManager.addEventListenerTo(this.getId(), 'mouseenter', () => this.open()),
            renderManager.addEventListenerTo(this.getId(), 'mouseleave', () => this.close())
        ])
    }

    protected async beforeUnrender(): Promise<void> {
        await Promise.all([
            this.close(),
            renderManager.removeEventListenerFrom(this.getId(), 'mouseenter'),
            renderManager.removeEventListenerFrom(this.getId(), 'mouseleave')
        ])
    }

    private isOpen(): boolean {
        return !!this.submenuWidgets
    }

    private async open(): Promise<void> {
        if (this.isOpen()) {
            return
        }

        this.submenuWidgets = this.menuItem.submenu.map(item => menuItemWidgetFactory.of(item))

        let html = `<div id="${this.getId()+'Container'}">`
        for (const submenuWidget of this.submenuWidgets) {
            html += `<div id="${submenuWidget.getId()}"></div>`
        }
        html += '</div>'
        await renderManager.addContentTo(this.getId(), html)

        await Promise.all(this.submenuWidgets.map(widget => widget.render()))
    }

    private async close(): Promise<void> {
        if (!this.isOpen() || !this.submenuWidgets) { // nullcheck redundant but needed to make compiler understand
            return
        }
        const submenuWidgetsToUnrender: MenuItemWidget<MenuItemFile|MenuItemFolder>[] = this.submenuWidgets
        this.submenuWidgets = undefined

        await Promise.all(submenuWidgetsToUnrender.map(widget => widget.unrender()))
        await renderManager.remove(this.getId()+'Container')
    }

}