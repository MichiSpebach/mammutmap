import { style } from '../styleAdapter';
import { renderManager } from '../RenderManager';
import { Widget } from '../Widget'
import { MenuItem } from './MenuItem';

export abstract class MenuItemWidget<MENU_ITEM extends MenuItem> extends Widget {

    protected readonly menuItem: MENU_ITEM

    public constructor(menuItem: MENU_ITEM) {
        super()
        this.menuItem = menuItem
    }

    public getId(): string {
        return 'ApplicationMenu'+this.menuItem.id
    }

    public async render(): Promise<void> {
        renderManager.addClassTo(this.getId(), style.getApplicationMenuClass('Item'))
        if (!this.menuItem.enabled) {
            renderManager.addClassTo(this.getId(), style.getApplicationMenuClass('ItemDisabled'))
        }
        await renderManager.setContentTo(this.getId(), this.formHtml())
        await this.afterRender()
    }

    protected abstract formHtml(): string

    protected abstract afterRender(): Promise<void>

    public async unrender(): Promise<void> {
        await this.beforeUnrender()
        await renderManager.setContentTo(this.getId(), '')
    }

    protected abstract beforeUnrender(): Promise<void>

}