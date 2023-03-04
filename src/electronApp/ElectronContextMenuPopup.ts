import { Menu as ElectronMenu } from 'electron'
import { MenuItem } from '../core/applicationMenu/MenuItem'
import { ContextMenuPopup } from '../core/contextMenu'
import { ClientPosition } from '../core/shape/ClientPosition'

export class ElectronContextMenuPopup implements ContextMenuPopup {

    public popup(items: MenuItem[], position: ClientPosition): void {
        ElectronMenu.buildFromTemplate(items).popup({x: position.x, y: position.y})
    }

}