import { Menu, MenuItem, dialog } from 'electron'
import { util } from './util'
import { fileSystem } from './fileSystemAdapter'
import { settings } from './Settings'
import * as map from './Map'
import { ProjectSettings } from './ProjectSettings'

export function setApplicationMenu(): void {
  const template: any = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Folder...',
          click: () => {
            openFolder()
          }
        },
        {
          label: 'Open ProjectFile '+ProjectSettings.fileName+'...',
          click: () => {
            openProjectFile()
          }
        }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Zoom speed',
          submenu: [
            buildZoomSpeedMenuItem(1),
            buildZoomSpeedMenuItem(2),
            buildZoomSpeedMenuItem(3),
            buildZoomSpeedMenuItem(4),
            buildZoomSpeedMenuItem(5)
          ]
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
}

export function addMenuItemToPlugins(menuItem: MenuItem): void {
  addMenuItemTo('Plugins', menuItem)
}

export function addMenuItemTo(parentMenuItemId: string, menuItem: MenuItem): void|never {
  const menu: Menu|undefined = getMenuItemById(parentMenuItemId).submenu
  if (!menu) {
    util.logError('cannot add MenuItem "'+menuItem.label+'" because parentMenuItem with id "'+parentMenuItemId+'" has to be initialized with submenu field')
  }
  menu.append(menuItem)
}

function getMenuItemById(id: string): MenuItem|never {
  return getApplicationMenu().getMenuItemById(id)
}

function getApplicationMenu(): Menu|never {
  const applicationMenu: Menu|null = Menu.getApplicationMenu()
  if (!applicationMenu) {
    util.logError('setApplicationMenu has to be called before')
  }
  return applicationMenu
}

async function openFolder(): Promise<void> {
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

  const projectSettingsPaths: string [] = [
    util.joinPaths([folderPath, '/', ProjectSettings.fileName]),
    util.joinPaths([folderPath, '/map/', ProjectSettings.fileName]),
    util.joinPaths([folderPath, '/../', ProjectSettings.fileName]),
    util.joinPaths([folderPath, '/../map/', ProjectSettings.fileName])
  ]
  for (const projectSettingsPath of projectSettingsPaths) {
    if (await fileSystem.doesDirentExistAndIsFile(projectSettingsPath)) {
      util.logInfo('found existing ProjectSettings at '+projectSettingsPath)
      try {
        await map.loadAndSetMap(await ProjectSettings.loadFromFileSystem(projectSettingsPath))
        return
      } catch (error) {
        util.logWarning('Failed to open ProjectSettings at '+projectSettingsPath+'. '+error)
      }
    }
  }

  util.logInfo('opening new project at '+folderPath)
  map.loadAndSetMap(new ProjectSettings(util.joinPaths([folderPath, '/map/', ProjectSettings.fileName]), '../', './'))
}

async function openProjectFile(): Promise<void> {
  const dialogReturnValue: Electron.OpenDialogReturnValue = await dialog.showOpenDialog({
    title:'Open a projectFile '+ProjectSettings.fileName,
    properties: ['openFile'],
    filters: [{name: ProjectSettings.fileName, extensions: ['json']}]
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

function buildZoomSpeedMenuItem(zoomSpeed: number): MenuItem {
  return new MenuItem({
    label: zoomSpeed.toString(),
    type: 'radio',
    checked: settings.getZoomSpeed() === zoomSpeed,
    click: () => settings.setZoomSpeed(zoomSpeed)
  })
}
