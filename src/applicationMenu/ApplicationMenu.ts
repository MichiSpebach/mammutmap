import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'
import { util } from '../util'
import { fileSystem } from '../fileSystemAdapter'
import * as map from '../Map'
import { ProjectSettings } from '../ProjectSettings'
import { dialog } from 'electron'
import * as settingsWidget from '../settingsWidget'
import { renderManager } from '../RenderManager'

export abstract class ApplicationMenu {
  
  protected readonly menuTree: MenuItemFolder

  public constructor() {
    const fileMenu: MenuItemFolder = new MenuItemFolder('File', 'File', [
      new MenuItemFile({label: 'Open Folder...', click: () => this.openFolder()}),
      new MenuItemFile({label: 'Open ProjectFile '+ProjectSettings.preferredFileNameExtension+'...', click: () => this.openProjectFile()})
    ])

    const settingsMenu: MenuItemFolder = new MenuItemFolder('Settings', 'Settings', [
      new MenuItemFile({label: 'ApplicationSettings', click: () => settingsWidget.openIfNotOpened()}),
      new MenuItemFile({label: 'DeveloperTools', click: () => renderManager.openDevTools()})
    ])

    const pluginsMenu: MenuItemFolder = new MenuItemFolder('Plugins', 'Plugins', [
      new MenuItemFile({label: 'MarketPlace (coming soon)', click: () => util.logInfo('MarketPlace is coming soon')}),
      new MenuItemFile({label: 'Tutorial to create plugins (coming soon)', click: () => util.logInfo('Tutorial to create plugins is coming soon')})
    ])

    this.menuTree = new MenuItemFolder('ApplicationMenu', 'ApplicationMenu', [fileMenu, settingsMenu, pluginsMenu])
  }

  public abstract initAndRender(): Promise<void>

  public addMenuItemToPlugins(menuItem: MenuItemFile|MenuItemFolder): void {
    this.addMenuItemTo('Plugins', menuItem)
  }

  public abstract addMenuItemTo(parentMenuItemId: string, menuItem: MenuItemFile|MenuItemFolder): void

  public abstract setMenuItemEnabled(menuItem: MenuItemFile|MenuItemFolder, enabled: boolean): Promise<void>

  protected findMenuItemById(menuItemId: string): MenuItemFile|MenuItemFolder|undefined {
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

    const folderPath: string = folderPaths[0]

    const filePathsToLookForProjectSettings: string[] = this.generatePreferredProjectSettingsFilePaths(folderPath)
      .concat(this.generateAlternativeProjectSettingsFilePaths(folderPath))

    for (const projectSettingsFilePath of filePathsToLookForProjectSettings) {
      if (await fileSystem.doesDirentExistAndIsFile(projectSettingsFilePath)) {
        util.logInfo('found existing ProjectSettings at '+projectSettingsFilePath)
        try {
          await map.loadAndSetMap(await ProjectSettings.loadFromFileSystem(projectSettingsFilePath))
          return
        } catch (error) {
          util.logWarning('Failed to open ProjectSettings at '+projectSettingsFilePath+'. '+error)
        }
      }
    }

    util.logInfo('opening new project at '+folderPath)
    map.loadAndSetMap(new ProjectSettings(util.joinPaths([folderPath, '/map/', ProjectSettings.preferredFileName]), '../', './'))
  }

  private generatePreferredProjectSettingsFilePaths(openedFolderPath: string): string[] {
    return this.generateFolderPathsToLookForProjectSettings(openedFolderPath).map((folderPath: string) => {
      return util.joinPaths([folderPath, ProjectSettings.preferredFileName])
    })
  }

  private generateAlternativeProjectSettingsFilePaths(openedFolderPath: string): string[] {
    let projectSettingsFilePaths: string[] = []
    for (const folderPath of this.generateFolderPathsToLookForProjectSettings(openedFolderPath)) {
      projectSettingsFilePaths = projectSettingsFilePaths.concat(
        ProjectSettings.alternativeFileNames.map((fileName: string) => {
          return util.joinPaths([folderPath, fileName])
        })
      )
    }
    return projectSettingsFilePaths
  }

  private generateFolderPathsToLookForProjectSettings(openedFolderPath: string): string[] {
    return [
      util.joinPaths([openedFolderPath, '/']),
      util.joinPaths([openedFolderPath, '/map/']),
      util.joinPaths([openedFolderPath, '/../']),
      util.joinPaths([openedFolderPath, '/../map/'])
    ]
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