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
    title:"Select a folder",
    properties: ["openDirectory"]
  })

  const folderPaths: string[] = dialogReturnValue.filePaths

  if (folderPaths === undefined) {
    util.logInfo("No destination folder selected")
  } else {
    util.logInfo("selected "+folderPaths)
    Map.new()
  }
}
