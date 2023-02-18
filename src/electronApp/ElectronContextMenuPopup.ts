import { Menu as ElectronMenu } from 'electron'
import { MenuItem } from '../core/applicationMenu/MenuItem'
import { ContextMenuPopup } from '../core/contextMenu'

export class ElectronContextMenuPopup implements ContextMenuPopup {

    public popup(items: MenuItem[]): void {
        ElectronMenu.buildFromTemplate(items).popup()
    }

}