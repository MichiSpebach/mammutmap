import { Menu, dialog } from 'electron'
import * as util from './util'
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
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
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
