import { ApplicationMenu } from './ApplicationMenu'
import { Menu, MenuItem as ElectronMenuItem } from 'electron'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'
import { util } from '../util'

export class ElectronApplicationMenu extends ApplicationMenu {

    public initAndRender(): Promise<void> {
      const menu = Menu.buildFromTemplate(this.menuTree.submenu)
      Menu.setApplicationMenu(menu)
      return Promise.resolve()
    }

    public addMenuItemTo(parentMenuItemId: string, menuItem: MenuItemFile|MenuItemFolder): void {
      const menu: Menu|undefined = this.getElectronMenuItemById(parentMenuItemId)?.submenu
      if (!menu) {
        util.logWarning('cannot add MenuItem "'+menuItem.label+'" because parentMenuItem with id "'+parentMenuItemId+'" has to be initialized with submenu field')
        return
      }
      menu.append(new ElectronMenuItem(menuItem))
    }

    public setMenuItemEnabled(menuItem: MenuItemFile|MenuItemFolder, enabled: boolean): Promise<void> {
        const electronMenuItem: ElectronMenuItem|null = this.getElectronMenuItemById(menuItem.id)
        if (!electronMenuItem) {
            util.logWarning('Failed to setMenuItemEnabled with id '+menuItem.id+' to '+enabled+' because it was not found.')
            return Promise.resolve()
        }
        electronMenuItem.enabled = enabled
        return Promise.resolve()
    }

    private getElectronMenuItemById(id: string): ElectronMenuItem|null {
      return this.getApplicationMenu().getMenuItemById(id)
    }

    private getApplicationMenu(): Menu|never {
      const applicationMenu: Menu|null = Menu.getApplicationMenu()
      if (!applicationMenu) {
        util.logError('setApplicationMenu has to be called before')
      }
      return applicationMenu
    }

}
