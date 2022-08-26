import { renderManager } from '../RenderManager'
import { Widget } from '../Widget'
import { MenuItemFolder } from './MenuItemFolder'
import { MenuItemWidget } from './MenuItemWidget'
import { util } from '../util'
import * as menuItemWidgetFactory from './menuItemWidgetFactory'
import { MenuItemFile } from './MenuItemFile'
import { style } from '../styleAdapter'

export class HtmlApplicationMenuWidget extends Widget {

    private readonly id: string
    private readonly menuTree: MenuItemFolder
    private submenuWidgets: MenuItemWidget<MenuItemFile|MenuItemFolder>[]|undefined

    public constructor(id: string, menuTree: MenuItemFolder) {
        super()
        this.id = id
        this.menuTree = menuTree
    }

    public getId(): string {
        return this.id
    }

    public async render(): Promise<void> {
        if (this.submenuWidgets) {
            util.logWarning('Expected HtmlApplicationMenuWidget to only get rendered once.')
        }
        renderManager.addClassTo(this.getId(), style.getApplicationMenuClass(''))

        this.submenuWidgets = this.menuTree.submenu.map(item => menuItemWidgetFactory.of(item))

        const html: string = this.submenuWidgets.map(widget => `<span id="${widget.getId()}"></span>`).join(' ')
        await renderManager.setContentTo(this.getId(), html)

        await Promise.all(this.submenuWidgets.map(widget => widget.render()))
    }

}