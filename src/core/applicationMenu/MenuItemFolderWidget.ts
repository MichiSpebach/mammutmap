import { renderManager } from '../renderEngine/renderManager'
import { MenuItemWidget } from './MenuItemWidget'
import { MenuItemFolder } from './MenuItemFolder'
import { MenuItemFolderContainerWidget } from './MenuItemFolderContainerWidget'
import { style } from '../styleAdapter'
import { util } from '../util/util'

export class MenuItemFolderWidget extends MenuItemWidget<MenuItemFolder> {

    private readonly submenuContainer: MenuItemFolderContainerWidget

    public constructor(menuItem: MenuItemFolder, closeMenu: () => Promise<void>) {
        super(menuItem)
        this.submenuContainer = new MenuItemFolderContainerWidget(this.getId()+'Container', menuItem.submenu, closeMenu)
    }

    protected formHtml(): string {
        const openDirection = this.menuItem.preferredOpenDirection
        const labelHtml: string = `<span class="${style.getApplicationMenuClass('ItemLabel')}">${this.menuItem.label} &gt;</span>`
        
        if (openDirection === 'bottom') {
            return this.formSubmenuContainerHtmlOnBottom()+labelHtml
        }
        if (openDirection === 'right') {
            return labelHtml+this.formSubmenuContainerHtmlOnRight()
        }
        util.logWarning(`MenuItemFolderWidget::formHtml() openDirection '${openDirection}' not implemented, defaulting to 'right'.`)
        return labelHtml+this.formSubmenuContainerHtmlOnRight()
    }

    private formSubmenuContainerHtmlOnBottom() {
        return `<span id="${this.submenuContainer.getId()}" style="top:100%;"></span>`
    }

    private formSubmenuContainerHtmlOnRight() {
        return `<span id="${this.submenuContainer.getId()}"></span>`
    }

    protected async afterRender(): Promise<void> {
        await Promise.all([
            renderManager.addClassTo(this.getId(), style.getApplicationMenuClass('ItemFolder')),
            renderManager.addEventListenerTo(this.getId(), 'mouseenter', () => this.onMouseenter()),
            renderManager.addEventListenerTo(this.getId(), 'mouseleave', () => this.onMouseleave())
            // TODO: implement toggle mode (click sets toggle to true and clicking somewhere else to false)? needs to keep track of every click that happens somewhere
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
        this.submenuContainer.unrender() // TODO: implement timeout/transition for unrender
    }

    public unrenderSubmenuContainer(): Promise<void> {
        return this.submenuContainer.unrender()
    }

}