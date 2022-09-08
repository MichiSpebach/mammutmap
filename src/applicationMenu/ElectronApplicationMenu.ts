import { Menu, MenuItem as ElectronMenuItem } from 'electron'
import { MenuItem } from './MenuItem'
import { MenuItemFolder } from './MenuItemFolder'
import { util } from '../util'

export class ElectronApplicationMenu {

  private readonly menuTree: MenuItemFolder
  private rendered: boolean = false

  public constructor(menuTree: MenuItemFolder) {
    this.menuTree = menuTree
  }

  public initAndRender(): Promise<void> {
    const menu = Menu.buildFromTemplate(this.menuTree.submenu)
    Menu.setApplicationMenu(menu)
    this.rendered = true
    return Promise.resolve()
  }

  public addMenuItemTo(parentMenuItem: MenuItemFolder, menuItem: MenuItem): void {
    if (!this.rendered) {
      return
    }

    const menu: Menu|undefined = this.getElectronMenuItemById(parentMenuItem.id)?.submenu
    if (!menu) {
      let message: string = 'Cannot add MenuItem "'+menuItem.label+'" to ElectronApplicationMenu'
      message += ' because electronParentMenuItem with id "'+parentMenuItem.id+'" has to be initialized with submenu field.'
      util.logWarning(message)
      return
    }
    menu.append(new ElectronMenuItem(menuItem))
  }

  public setMenuItemEnabled(menuItem: MenuItem, enabled: boolean): Promise<void> {
    if (!this.rendered) {
      return Promise.resolve()
    }

    const electronMenuItem: ElectronMenuItem|null = this.getElectronMenuItemById(menuItem.id)
    if (!electronMenuItem) {
        util.logWarning('Failed to setMenuItemEnabled on electronMenu with id '+menuItem.id+' to '+enabled+' because it was not found.')
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
