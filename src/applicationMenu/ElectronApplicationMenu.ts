import { ApplicationMenu } from './applicationMenu'
import { ProjectSettings } from '../ProjectSettings'
import * as settingsWidget from '../settingsWidget'
import { renderManager } from '../RenderManager'
import { Menu, MenuItem as ElectronMenuItem, dialog } from 'electron'
import { MenuItemFile } from './MenuItemFile'
import { MenuItemFolder } from './MenuItemFolder'
import { util } from '../util'
import { fileSystem } from '../fileSystemAdapter'
import * as map from '../Map'

export class ElectronApplicationMenu extends ApplicationMenu {

    public initAndRender(): Promise<void> {
      const template: any = [
        {
          label: 'File',
          submenu: [
            {
              label: 'Open Folder...',
              click: () => {
                this.openFolder()
              }
            },
            {
              label: 'Open ProjectFile '+ProjectSettings.preferredFileNameExtension+'...',
              click: () => {
                this.openProjectFile()
              }
            }
          ]
        },
        {
          label: 'Settings',
          submenu: [
            {
              label: 'ApplicationSettings',
              click: () => {
                settingsWidget.openIfNotOpened()
              }
            },
            {
              label: 'DeveloperTools',
              click: () => {
                renderManager.openDevTools()
              }
            }
          ]
        },
        {
          id: 'Plugins',
          label: 'Plugins',
          submenu: [
            {
              label: 'MarketPlace (coming soon)'
            },
            {
              label: 'Tutorial to create plugins (coming soon)'
            }
          ]
        }
      ]
      const menu = Menu.buildFromTemplate(template)
      Menu.setApplicationMenu(menu)

      return Promise.resolve()
    }
  
    public addMenuItemToPlugins(menuItem: MenuItemFile|MenuItemFolder): void {
      this.addMenuItemTo('Plugins', menuItem)
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