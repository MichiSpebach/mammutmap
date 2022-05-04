import { Menu, MenuItem, dialog } from 'electron'
import { util } from './util'
import { fileSystem } from './fileSystemAdapter'
import { settings, settingsOnStartup } from './Settings'
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
          label: 'Open ProjectFile '+ProjectSettings.preferredFileNameExtension+'...',
          click: () => {
            openProjectFile()
          }
        }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        buildZoomSpeedMenu()
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

  const filePathsToLookForProjectSettings: string[] = generatePreferredProjectSettingsFilePaths(folderPath)
    .concat(generateAlternativeProjectSettingsFilePaths(folderPath))

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

function generatePreferredProjectSettingsFilePaths(openedFolderPath: string): string[] {
  return generateFolderPathsToLookForProjectSettings(openedFolderPath).map((folderPath: string) => {
    return util.joinPaths([folderPath, ProjectSettings.preferredFileName])
  })
}

function generateAlternativeProjectSettingsFilePaths(openedFolderPath: string): string[] {
  let projectSettingsFilePaths: string[] = []
  for (const folderPath of generateFolderPathsToLookForProjectSettings(openedFolderPath)) {
    projectSettingsFilePaths = projectSettingsFilePaths.concat(
      ProjectSettings.alternativeFileNames.map((fileName: string) => {
        return util.joinPaths([folderPath, fileName])
      })
    )
  }
  return projectSettingsFilePaths
}

function generateFolderPathsToLookForProjectSettings(openedFolderPath: string): string[] {
  return [
    util.joinPaths([openedFolderPath, '/']),
    util.joinPaths([openedFolderPath, '/map/']),
    util.joinPaths([openedFolderPath, '/../']),
    util.joinPaths([openedFolderPath, '/../map/'])
  ]
}

async function openProjectFile(): Promise<void> {
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

function buildZoomSpeedMenu(): MenuItem {
  const zoomSpeedMenu = new MenuItem({
    label: 'Zoom speed',
    submenu: []
  })
  for (let i = 1; i <= 5; i++) {
    buildZoomSpeedMenuItem(i).then(item => zoomSpeedMenu.submenu?.append(item))
  }
  return zoomSpeedMenu
}

async function buildZoomSpeedMenuItem(zoomSpeed: number): Promise<MenuItem> {
  return new MenuItem({
    label: zoomSpeed.toString(),
    type: 'radio',
    checked: (await settingsOnStartup).getZoomSpeed() === zoomSpeed,
    click: () => settings.setZoomSpeed(zoomSpeed)
  })
}
