import { MenuItemFolder } from '../core/applicationMenu/MenuItemFolder'
import { ElectronApplicationMenu } from './ElectronApplicationMenu'
import { HtmlApplicationMenu } from '../core/applicationMenu/HtmlApplicationMenu'
import { settings } from '../core/Settings'
import { MenuItem } from '../core/applicationMenu/MenuItem'
import { ApplicationMenu, ApplicationMenuOptions } from '../core/applicationMenu/applicationMenu'

export class ElectronAndHtmlApplicationMenu implements ApplicationMenu {
  private readonly electronApplicationMenu: ElectronApplicationMenu
  private readonly htmlApplicatioinMenu: HtmlApplicationMenu

  public constructor(options?: ApplicationMenuOptions) {
    this.electronApplicationMenu = new ElectronApplicationMenu(options)
    this.htmlApplicatioinMenu = new HtmlApplicationMenu(options)
  }

  public async initAndRender(): Promise<void> {
    const pros: Promise<void>[] = []

    pros.push(this.electronApplicationMenu.initAndRender())
    pros.push(this.setHtmlApplicationMenuActive(settings.getBoolean('htmlApplicationMenu')));
    settings.subscribeBoolean('htmlApplicationMenu', (active) => this.setHtmlApplicationMenuActive(active))

    await Promise.all(pros)
  }

  private setHtmlApplicationMenuActive(active: boolean): Promise<void> {
    if (active) {
      return this.htmlApplicatioinMenu.renderUp()
    } else {
      return this.htmlApplicatioinMenu.renderDown()
    }
  }

  public async addMenuItemToPlugins(menuItem: MenuItem): Promise<void> {
    await Promise.all([
      this.electronApplicationMenu.addMenuItemToPlugins(menuItem),
      this.htmlApplicatioinMenu.addMenuItemToPlugins(menuItem)
    ])
  }

  public async addMenuItemTo(parentMenuItem: string|MenuItemFolder, menuItem: MenuItem): Promise<void> {
    await Promise.all([
      this.electronApplicationMenu.addMenuItemTo(parentMenuItem, menuItem),
      this.htmlApplicatioinMenu.addMenuItemTo(parentMenuItem, menuItem)
    ])
  }

  public async setMenuItemEnabled(menuItem: MenuItem, enabled: boolean): Promise<void> {
    await Promise.all([
      this.electronApplicationMenu.setMenuItemEnabled(menuItem, enabled),
      this.htmlApplicatioinMenu.setMenuItemEnabled(menuItem, enabled)
    ])
  }

}