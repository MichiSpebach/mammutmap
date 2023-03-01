import { style } from '../styleAdapter'
import { renderManager } from '../RenderManager'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemWidget } from './MenuItemWidget'

export class MenuItemFileWidget extends MenuItemWidget<MenuItemFile> {

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

    private onClick() {
        if (this.menuItem.enabled) {
            this.menuItem.click()
        }
    }

}