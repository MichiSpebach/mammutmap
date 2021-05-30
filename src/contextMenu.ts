import { Menu, MenuItem } from 'electron'
import * as util from './util'
import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { FolderBox } from './box/FolderBox'
import { WayPointData } from './box/WayPointData'

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
  return new MenuItem({label: 'link from here', click: () => addLinkToBox(box, clientX, clientY)})
}

async function addLinkToBox(box: Box, clientX: number, clientY: number): Promise<void> {
  const localPosition: {x: number, y: number} = await box.transformClientPositionToLocal(clientX, clientY)
  const from = new WayPointData(box.getId(), box.getName(), localPosition.x, localPosition.y)

  const rightMiddle: {x: number, y: number} = box.transformLocalToParent(localPosition.x, localPosition.y)
  const to = new WayPointData(box.getParent().getId(), box.getParent().getName(), rightMiddle.x + 5, rightMiddle.y)

  box.getParent().addLink(from, to)
}
