import { renderManager } from '../RenderManager'
import { Widget } from '../Widget'
import { MenuItemFolder } from './MenuItemFolder'
import { MenuItemWidget } from './MenuItemWidget'
import { util } from '../util/util'
import * as menuItemWidgetFactory from './menuItemWidgetFactory'
import { MenuItem } from './MenuItem'
import { style } from '../styleAdapter'

export class HtmlApplicationMenuWidget extends Widget {

    private readonly id: string
    private readonly menuTree: MenuItemFolder
    private submenuWidgets: MenuItemWidget<MenuItem>[]|undefined

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

        this.submenuWidgets = this.menuTree.submenu.map(item => menuItemWidgetFactory.of(item, 'bottom'))

        const html: string = this.submenuWidgets.map(widget => `<span id="${widget.getId()}" style="display:inline-block"></span>`).join(' ')
        await renderManager.setContentTo(this.getId(), html)

        await Promise.all(this.submenuWidgets.map(widget => widget.render()))
    }

    public async unrender(): Promise<void> {
        if (!this.submenuWidgets) {
            util.logWarning('Unrender called on HtmlApplicationMenuWidget altough it is not rendered.')
            return
        }

        await Promise.all(this.submenuWidgets.map(widget => widget.unrender()))
        await renderManager.setContentTo(this.getId(), '')
        await renderManager.removeClassFrom(this.getId(), style.getApplicationMenuClass(''))
        
        this.submenuWidgets = undefined
    }

}