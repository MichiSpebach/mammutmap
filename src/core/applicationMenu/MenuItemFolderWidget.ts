import { renderManager } from '../RenderManager'
import { MenuItemWidget } from './MenuItemWidget'
import { MenuItemFolder } from './MenuItemFolder'
import { MenuItemFolderContainerWidget } from './MenuItemFolderContainerWidget'
import { style } from '../styleAdapter'
import { util } from '../util/util'

export class MenuItemFolderWidget extends MenuItemWidget<MenuItemFolder> {

    private submenuContainer: MenuItemFolderContainerWidget

    public constructor(menuItem: MenuItemFolder) {
        super(menuItem)
        this.submenuContainer = new MenuItemFolderContainerWidget(this.getId()+'Container', menuItem.submenu)
    }

    protected formHtml(): string {
        const labelHtml: string = `<span class="${style.getApplicationMenuClass('ItemLabel')}">${this.menuItem.label} &gt;</span>`
        return this.menuItem.switchOpenDirection({
            bottom: () => {
                const submenuContainerHtml: string = `<span id="${this.submenuContainer.getId()}" style="top:100%;"></span>`
                return submenuContainerHtml+labelHtml
            },
            right: () => {
                const submenuContainerHtml: string = `<span id="${this.submenuContainer.getId()}"></span>`
                return labelHtml+submenuContainerHtml
            }
        })
    }

    protected async afterRender(): Promise<void> {
        await Promise.all([
            renderManager.addClassTo(this.getId(), style.getApplicationMenuClass('ItemFolder')),
            renderManager.addEventListenerTo(this.getId(), 'mouseenter', () => this.onMouseenter()),
            renderManager.addEventListenerTo(this.getId(), 'mouseleave', () => this.onMouseleave())
            // TODO: implement toggle mode (click sets toggle to true and clicking somewhere else to false)
        ])
    }

    protected async beforeUnrender(): Promise<void> {
        await Promise.all([
            this.submenuContainer.unrender(),
            renderManager.removeEventListenerFrom(this.getId(), 'mouseenter'),
            renderManager.removeEventListenerFrom(this.getId(), 'mouseleave')
        ])
    }

    private onMouseenter() {
        if (this.menuItem.enabled) {
            this.submenuContainer.render()
        }
    }

    private onMouseleave() {
        this.submenuContainer.unrender() // TODO: timeout/transition for unrender?
    }

}