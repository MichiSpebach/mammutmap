import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'
import { util } from '../util'
import * as map from '../Map'
import { ProjectSettings } from '../ProjectSettings'
import { dialog } from 'electron'
import * as settingsWidget from '../settingsWidget'
import { renderManager } from '../RenderManager'
import { ElectronApplicationMenu } from './ElectronApplicationMenu'
import { HtmlApplicationMenu } from './HtmlApplicationMenu'
import { settings } from '../Settings'
import { MenuItem } from './MenuItem'

class ApplicationMenu {

  private readonly menuTree: MenuItemFolder
  private readonly electronApplicationMenu: ElectronApplicationMenu
  private readonly htmlApplicatioinMenu: HtmlApplicationMenu

  public constructor() {
    const fileMenu: MenuItemFolder = new MenuItemFolder({id: 'File', label: 'File', submenu: [
      new MenuItemFile({label: 'Open Folder...', click: () => this.openFolder()}),
      new MenuItemFile({label: 'Open ProjectFile '+ProjectSettings.preferredFileNameExtension+'...', click: () => this.openProjectFile()})
    ]})

    const settingsMenu: MenuItemFolder = new MenuItemFolder({id: 'Settings', label: 'Settings', submenu: [
      new MenuItemFile({label: 'ApplicationSettings', click: () => settingsWidget.openIfNotOpened()}),
      new MenuItemFile({label: 'DeveloperTools', click: () => renderManager.openDevTools()})
    ]})

    const pluginsMenu: MenuItemFolder = new MenuItemFolder({id: 'Plugins', label: 'Plugins', submenu: [
      new MenuItemFile({label: 'MarketPlace (coming soon)', click: () => util.logInfo('MarketPlace is coming soon')}),
      new MenuItemFile({label: 'Tutorial to create plugins (coming soon)', click: () => util.logInfo('Tutorial to create plugins is coming soon')})
    ]})

    this.menuTree = new MenuItemFolder({id: 'ApplicationMenu', label: 'ApplicationMenu', submenu: [fileMenu, settingsMenu, pluginsMenu]})
    this.electronApplicationMenu = new ElectronApplicationMenu(this.menuTree)
    this.htmlApplicatioinMenu = new HtmlApplicationMenu(this.menuTree)
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

  public addMenuItemToPlugins(menuItem: MenuItem): void {
    this.addMenuItemTo('Plugins', menuItem)
  }

  public addMenuItemTo(parentMenuItemId: string, menuItem: MenuItem): void {
    const parentMenuItem: MenuItem|undefined = this.findMenuItemById(parentMenuItemId)
    if (!parentMenuItem) {
        util.logWarning(`Cannot add menuItem '${menuItem.label}' to menu with id '${parentMenuItemId}' because it was not found.`)
        return
    }
    if (!(parentMenuItem instanceof MenuItemFolder)) {
        util.logWarning(`Cannot add menuItem '${menuItem.label}' to menu with id '${parentMenuItemId}' because it is not a MenuItemFolder.`)
        return
    }

    parentMenuItem.submenu.push(menuItem)

    this.electronApplicationMenu.addMenuItemTo(parentMenuItem, menuItem)
    this.htmlApplicatioinMenu.addMenuItemTo(parentMenuItem, menuItem)
  }

  public async setMenuItemEnabled(menuItem: MenuItem, enabled: boolean): Promise<void> {
    menuItem.enabled = enabled

    await Promise.all([
      this.electronApplicationMenu.setMenuItemEnabled(menuItem, enabled),
      this.htmlApplicatioinMenu.setMenuItemEnabled(menuItem, enabled)
    ])
  }

  private findMenuItemById(menuItemId: string): MenuItem|undefined {
    return this.menuTree.findMenuItemById(menuItemId)
  }

  private async openFolder(): Promise<void> {
    const dialogReturnValue: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({
      title:'Open a folder',
      properties: ['openDirectory']
    })

    const folderPaths: string[] = dialogReturnValue.filePaths

    if (folderPaths.length === 0) {
      util.logInfo('no folder selected')
      return
    }

    if (folderPaths.length !== 1) {
      util.logWarning('expected exactly one selected folder but are '+folderPaths.length)
    }

    map.searchAndLoadMapCloseTo(folderPaths[0])
  }

  private async openProjectFile(): Promise<void> {
    const dialogReturnValue: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({
      title:'Open a projectFile '+ProjectSettings.preferredFileNameExtension,
      properties: ['openFile'],
      filters: [
        {name: '.'+ProjectSettings.preferredFileNameExtension, extensions: [ProjectSettings.preferredFileNameExtension]},
        {name: '.'+ProjectSettings.alternativeFileNameExtension, extensions: [ProjectSettings.alternativeFileNameExtension]}
      ]
    })

    const filePaths: string[] = dialogReturnValue.filePaths

    if (filePaths.length === 0) {
      util.logInfo('no file selected')
      return
    }

    if (filePaths.length !== 1) {
      util.logWarning('expected exactly one selected file but are '+filePaths.length)
    }

    const filePath: string = filePaths[0]
    util.logInfo('opening existing ProjectSettings at '+filePath)
    try {
      await map.loadAndSetMap(await ProjectSettings.loadFromFileSystem(filePath))
    } catch (error) {
      util.logError('Failed to open ProjectSettings at '+filePath+'. '+error)
    }
  }

}

export let applicationMenu: ApplicationMenu = new ApplicationMenu()
