import { renderManager } from '../RenderManager'
import { MenuItemWidget } from './MenuItemWidget'
import { MenuItemFolder } from './MenuItemFolder'
import { MenuItemFolderContainerWidget } from './MenuItemFolderContainerWidget'

export class MenuItemFolderWidget extends MenuItemWidget<MenuItemFolder> {

    private submenuContainer: MenuItemFolderContainerWidget

    public constructor(menuItem: MenuItemFolder) {
        super(menuItem)
        this.submenuContainer = new MenuItemFolderContainerWidget(this.getId()+'Container', menuItem.submenu)
    }

    protected formHtml(): string {
        const labelHtml: string = this.menuItem.label+' &gt;'
        const submenuContainerPlaceholder: string = `<div id="${this.submenuContainer.getId()}"></div>`
        return labelHtml+submenuContainerPlaceholder
    }

    protected async afterRender(): Promise<void> {
        await Promise.all([
            renderManager.addEventListenerTo(this.getId(), 'mouseenter', () => this.submenuContainer.render()),
            renderManager.addEventListenerTo(this.getId(), 'mouseleave', () => this.submenuContainer.unrender())
        ])
    }

    protected async beforeUnrender(): Promise<void> {
        await Promise.all([
            this.submenuContainer.unrender(),
            renderManager.removeEventListenerFrom(this.getId(), 'mouseenter'),
            renderManager.removeEventListenerFrom(this.getId(), 'mouseleave')
        ])
    }

}