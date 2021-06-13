import { Menu, MenuItem } from 'electron'
import * as util from './util'
import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { FolderBox } from './box/FolderBox'
import { WayPointData } from './box/WayPointData'
import { Link } from './box/Link'
import { DragManager } from './DragManager'

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

// TODO: move into Box?
async function addLinkToBox(box: Box, clientX: number, clientY: number): Promise<void> {
  const localPosition: {x: number, y: number} = await box.transformClientPositionToLocal(clientX, clientY)
  const from = new WayPointData(box.getId(), box.getName(), localPosition.x, localPosition.y)
  const to = new WayPointData(box.getId(), box.getName(), localPosition.x, localPosition.y)

  const link: Link = await box.getParent().links.addLink(from, to)

  DragManager.startDragWithClickToDropMode(link.getTo())
}
