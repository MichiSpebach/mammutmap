import { Menu, MenuItem } from 'electron'
import { util } from './util'
import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { FolderBox } from './box/FolderBox'
import { WayPointData } from './box/WayPointData'
import { Link } from './box/Link'
import { DragManager } from './DragManager'
import { BoxMapLinkPathData } from './box/BoxMapLinkPathData'

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
  menu.insert(0, buildAddLinkItem(box, clientX, clientY))
  menu.popup()
}

export function openForFolderBox(box: FolderBox, clientX: number, clientY: number): void {
  const menu = new Menu()
  menu.append(buildAddLinkItem(box, clientX, clientY))
  menu.popup()
}

export function openForLink(link: Link, clientX: number, clientY: number): void {
  const menu = new Menu()
  menu.append(buildRemoveLinkItem(link))
  menu.popup()
}

function buildAddLinkItem(box: Box, clientX: number, clientY: number): MenuItem {
  return new MenuItem({label: 'link from here', click: () => addLinkToBox(box, clientX, clientY)})
}

function buildRemoveLinkItem(link: Link): MenuItem {
  return new MenuItem({label: 'remove link', click: () => link.getManagingBoxLinks().removeLink(link)})
}

// TODO: move into Box?
async function addLinkToBox(box: Box, clientX: number, clientY: number): Promise<void> {
  const localPosition: {x: number, y: number} = await box.transformClientPositionToLocal(clientX, clientY)
  const from = new WayPointData(box.getId(), box.getName(), localPosition.x, localPosition.y)
  const to = new WayPointData(box.getId(), box.getName(), localPosition.x, localPosition.y)

  const link: Link = await box.links.addLink(new BoxMapLinkPathData([from]), new BoxMapLinkPathData([to]), false)

  DragManager.startDragWithClickToDropMode(link.getTo())
}
