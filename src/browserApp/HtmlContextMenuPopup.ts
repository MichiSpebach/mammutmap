import { ContextMenuPopup } from '../core/contextMenu'
import { MenuItem } from '../core/applicationMenu/MenuItem'
import { MenuItemFolderContainerWidget } from '../core/applicationMenu/MenuItemFolderContainerWidget'
import { MouseEventResultAdvanced, renderManager, RenderPriority } from '../core/RenderManager'
import * as indexHtmlIds from '../core/indexHtmlIds'
import { createElement, RenderElement } from '../core/util/RenderElement'
import { ClientPosition } from '../core/shape/ClientPosition'

export class HtmlContextMenuPopup implements ContextMenuPopup {

    private openedWidget: MenuItemFolderContainerWidget|undefined = undefined

    public async popup(items: MenuItem[], position: ClientPosition): Promise<void> {
        await this.closeIfOpened()

        const element: RenderElement = createElement('div', {
            id: 'contextMenu',
            style: {
                position: 'fixed',
                left: position.x+'px',
                top: position.y+'px'
            }
        }, [])
        renderManager.addElementTo(indexHtmlIds.bodyId, element, RenderPriority.RESPONSIVE)

        this.openedWidget = new MenuItemFolderContainerWidget('contextMenu', items)
        this.openedWidget.render()

        renderManager.addEventListenerAdvancedTo(indexHtmlIds.htmlId, 'mousedown', {capture: true}, (result: MouseEventResultAdvanced) => {
            if (!this.openedWidget || result.targetPathElementIds.includes(this.openedWidget.getId())) {
                return
            }
            this.closeIfOpened()
        })
    }

    private async closeIfOpened(): Promise<void> {
        if (!this.openedWidget) {
            return
        }
        await this.openedWidget.unrender()
        await renderManager.remove(this.openedWidget.getId())
        await renderManager.removeEventListenerFrom(indexHtmlIds.htmlId, 'mousedown'/*, this.mousedownAnywhereListener*/) // TODO: specify listener to remove as soon as implemented
        this.openedWidget = undefined
    }
    
}