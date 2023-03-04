import { style } from '../styleAdapter'
import { renderManager } from '../RenderManager'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemWidget } from './MenuItemWidget'

export class MenuItemFileWidget extends MenuItemWidget<MenuItemFile> {

    private readonly closeMenu: () => Promise<void>

    public constructor(menuItem: MenuItemFile, closeMenu: () => Promise<void>) {
        super(menuItem)
        this.closeMenu = closeMenu
    }

    protected formHtml(): string {
        return `<span class="${style.getApplicationMenuClass('ItemLabel')}">${this.menuItem.label}</span>`
    }

    protected async afterRender(): Promise<void> {
        await Promise.all([
            renderManager.addClassTo(this.getId(), style.getApplicationMenuClass('ItemFile')),
            renderManager.addEventListenerTo(this.getId(), 'click', () => this.onClick())
        ])
    }

    protected beforeUnrender(): Promise<void> {
        return renderManager.removeEventListenerFrom(this.getId(), 'click')
    }

    private async onClick() {
        if (!this.menuItem.enabled) {
            return
        }
        await Promise.all([
            this.menuItem.click(),
            this.closeMenu()
        ])
    }

}