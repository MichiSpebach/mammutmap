import { Menu, MenuItem, dialog } from 'electron'
import * as util from './util'
import { settings } from './Settings'
import { Map } from './Map'

export function setApplicationMenu(): void {
  const template: any = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open...',
          click: () => {
            openFolder()
          }
        },
        {
          label: 'Open Folder...',
          click: () => {
            openFolder()
          }
        },
        {
          label: 'Open root.json...'
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
    title:'Select a folder',
    properties: ['openDirectory']
  })

  const folderPaths: string[] = dialogReturnValue.filePaths

  if (folderPaths === undefined) {
    util.logInfo('no folder selected')
  } else {
    if (folderPaths.length !== 1) {
      util.logWarning('expected exactly one selected folder but is '+folderPaths.length)
    }
    const folderPath: string = folderPaths[0]
    util.logInfo('opening '+folderPath)
    Map.new(folderPath+'/src', folderPath+'/map')
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
