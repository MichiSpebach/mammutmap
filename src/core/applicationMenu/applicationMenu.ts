import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'
import { util } from '../util/util'
import * as map from '../Map'
import { ProjectSettings } from '../ProjectSettings'
import { fileSystem, OpenDialogReturnValue } from '../fileSystemAdapter'
import * as settingsWidget from '../settingsWidget'
import { renderManager } from '../RenderManager'
import { MenuItem } from './MenuItem'
import { MessagePopup } from '../MessagePopup'
import { settings } from '../Settings'

export let applicationMenu: ApplicationMenu

export async function initAndRender(object: ApplicationMenu): Promise<void> {
  applicationMenu = object
  await object.initAndRender()
}

export interface ApplicationMenu { // TODO: rename to interface ApplicationMenuView and AbstractApplicationMenu to ApplicationMenu calling the view which was set by init?
  initAndRender(): Promise<void>
  addMenuItemToPlugins(menuItem: MenuItem): Promise<void>
  addMenuItemTo(parentMenuItem: string|MenuItemFolder, menuItem: MenuItem): Promise<void>
  setMenuItemEnabled(menuItem: MenuItem, enabled: boolean): Promise<void>
}

export abstract class AbstractApplicationMenu implements ApplicationMenu {
  protected readonly menuTree: MenuItemFolder

  public constructor() {

    const openFolderMenuItem = new MenuItemFile({label: 'Open Folder...', click: () => this.openFolder()})
    const openFileMenuItem = new MenuItemFile({label: 'Open ProjectFile '+ProjectSettings.preferredFileNameExtension+'... (experimental)', enabled: settings.getBoolean('experimentalFeatures'), click: () => this.openProjectFile()})
    settings.subscribeBoolean('experimentalFeatures', async (newValue) => {openFileMenuItem.enabled = newValue})

    const fileMenu: MenuItemFolder = new MenuItemFolder({id: 'File', label: 'File', preferredOpenDirection: 'bottom', submenu: [
      openFolderMenuItem,
      openFileMenuItem
    ]})

    const settingsMenu: MenuItemFolder = new MenuItemFolder({id: 'Settings', label: 'Settings', preferredOpenDirection: 'bottom', submenu: [
      new MenuItemFile({label: 'ApplicationSettings', click: () => settingsWidget.openIfNotOpened()}),
      new MenuItemFile({label: 'DeveloperTools', click: () => renderManager.openDevTools()})
    ]})

    const pluginsMenu: MenuItemFolder = new MenuItemFolder({id: 'Plugins', label: 'Plugins', preferredOpenDirection: 'bottom', submenu: [
      new MenuItemFile({label: 'MarketPlace (coming soon)', enabled: false, click: () => util.logInfo('MarketPlace is coming soon')}),
      new MenuItemFile({label: 'Tutorial to create plugins (coming soon)', enabled: false, click: () => util.logInfo('Tutorial to create plugins is coming soon')})
    ]})

    const infoMenuItem: MenuItemFile = new MenuItemFile({label: 'Info', click: () => {
      MessagePopup.buildAndRender('Info', `Join on GitHub: ${util.createWebLinkHtml(util.githubProjectAddress)}`)
    }})

    this.menuTree = new MenuItemFolder({id: 'ApplicationMenu', label: 'ApplicationMenu', submenu: [fileMenu, settingsMenu, pluginsMenu, infoMenuItem]})
  }

  public abstract initAndRender(): Promise<void>

  public async addMenuItemToPlugins(menuItem: MenuItem): Promise<void> {
    await this.addMenuItemTo('Plugins', menuItem)
  }

  public async addMenuItemTo(parentMenuItem: string|MenuItemFolder, menuItem: MenuItem): Promise<void> {
    if (typeof parentMenuItem === 'string') {
      const foundParentMenuItem: MenuItem|undefined = this.findMenuItemById(parentMenuItem)
      if (!foundParentMenuItem) {
        util.logWarning(`Cannot add menuItem '${menuItem.label}' to menu with id '${parentMenuItem}' because it was not found.`)
        return
      }
      if (!(foundParentMenuItem instanceof MenuItemFolder)) {
        util.logWarning(`Cannot add menuItem '${menuItem.label}' to menu with id '${parentMenuItem}' because it is not a MenuItemFolder.`)
        return
      }
      parentMenuItem = foundParentMenuItem
    }

    parentMenuItem.submenu.push(menuItem)
    await this.addMenuItemToAfter(parentMenuItem, menuItem)
  }

  protected abstract addMenuItemToAfter(parentMenuItem: MenuItemFolder, menuItem: MenuItem): Promise<void>
  
  public async setMenuItemEnabled(menuItem: MenuItem, enabled: boolean): Promise<void> {
    menuItem.enabled = enabled
    await this.setMenuItemEnabledAfter(menuItem, enabled)
  }
  
  protected abstract setMenuItemEnabledAfter(menuItem: MenuItem, enabled: boolean): Promise<void>

  private findMenuItemById(menuItemId: string): MenuItem|undefined {
    return this.menuTree.findMenuItemById(menuItemId)
  }

  private async openFolder(): Promise<void> {
    const dialogReturnValue: OpenDialogReturnValue = await fileSystem.showOpenDialog({
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
    const dialogReturnValue: OpenDialogReturnValue = await fileSystem.showOpenDialog({
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