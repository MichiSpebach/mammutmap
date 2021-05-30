import { Menu, MenuItem } from 'electron'
import * as util from './util'
import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { FolderBox } from './box/FolderBox'
import { BoxConnector } from './box/BoxConnector'

export function openForFileBox(box: FileBox, clientX: number, clientY: number): void {
  const atomCommand: string = 'atom '+box.getSrcPath()
  const template: any = [
    {
      label: 'run '+atomCommand,
      click: () => {
        util.runShellCommand(atomCommand)
      }
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  menu.insert(0, buildLinkItem(box, clientX, clientY))
  menu.popup()
}

export function openForFolderBox(box: FolderBox, clientX: number, clientY: number): void {
  const menu = new Menu()
  menu.append(buildLinkItem(box, clientX, clientY))
  menu.popup()
}

function buildLinkItem(box: Box, clientX: number, clientY: number): MenuItem {
  return new MenuItem({label: 'link from here', click: () => BoxConnector.addLinkToBox(box, clientX, clientY)})
}
