import { Menu, MenuItem } from 'electron'
import { util } from './util'
import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { FolderBox } from './box/FolderBox'
import { WayPointData } from './box/WayPointData'
import { Link } from './box/Link'
import { DragManager } from './DragManager'
import { LinkEndData } from './box/LinkEndData'
import { ClientPosition, LocalPosition } from './box/Transform'
import { BoxMapData } from './box/BoxMapData'
import { TextInputPopup } from './TextInputPopup'

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
  menu.append(buildRenameBoxItem(box))
  menu.popup()
}

export function openForFolderBox(box: FolderBox, clientX: number, clientY: number): void {
  const menu = new Menu()
  menu.append(buildAddLinkItem(box, clientX, clientY))
  menu.append(buildRenameBoxItem(box))
  menu.append(buildAddNewFileItem(box, clientX, clientY))
  menu.append(buildAddNewFolderItem(box, clientX, clientY))
  menu.popup()
}

export function openForLink(link: Link, clientX: number, clientY: number): void {
  const menu = new Menu()
  menu.append(buildHideOrShowLinkItem(link))
  menu.append(buildRemoveLinkItem(link))
  menu.popup()
}

function buildAddLinkItem(box: Box, clientX: number, clientY: number): MenuItem {
  return new MenuItem({label: 'link from here', click: () => addLinkToBox(box, clientX, clientY)})
}

function buildHideOrShowLinkItem(link: Link): MenuItem {
  if (link.includesTag('hidden')) {
    return new MenuItem({label: 'show link', click: () => link.removeTag('hidden')})
  } else {
    return new MenuItem({label: 'hide link', click: () => link.addTag('hidden')})
  }
}

function buildRemoveLinkItem(link: Link): MenuItem {
  return new MenuItem({label: 'remove link', click: () => link.getManagingBoxLinks().removeLink(link)})
}

function buildRenameBoxItem(box: Box): MenuItem {
  return new MenuItem({label: 'rename', click: async () => {
    const newName: string|undefined = await TextInputPopup.buildAndRenderAndAwaitResolve('Rename Box', box.getName())
    if (newName) {
      await box.rename(newName)
    }
  }})
}

function buildAddNewFileItem(box: FolderBox, clientX: number, clientY: number): MenuItem {
  return new MenuItem({label: 'new file', click: async () => {
    const mapData: BoxMapData = await buildMapDataForNewBox(box, clientX, clientY)
    await box.addNewFileAndSave(mapData.id, mapData)
    //ScaleManager.startWithClickToDropMode(newBox) // TODO: implement
  }})
}

function buildAddNewFolderItem(box: FolderBox, clientX: number, clientY: number): MenuItem {
  return new MenuItem({label: 'new folder', click: async () => {
    const mapData: BoxMapData = await buildMapDataForNewBox(box, clientX, clientY)
    await box.addNewFolderAndSave(mapData.id, mapData)
    //ScaleManager.startWithClickToDropMode(newBox) // TODO: implement
  }})
}

async function buildMapDataForNewBox(parentBox: FolderBox, clientX: number, clientY: number): Promise<BoxMapData> {
  const position: LocalPosition = await parentBox.transform.clientToLocalPosition(new ClientPosition(clientX, clientY))
  return BoxMapData.buildNew(position.percentX, position.percentY, 16, 8)
}

// TODO: move into Box?
async function addLinkToBox(box: Box, clientX: number, clientY: number): Promise<void> {
  const position: LocalPosition = await box.transform.clientToLocalPosition(new ClientPosition(clientX, clientY))
  const from = new WayPointData(box.getId(), box.getName(), position.percentX, position.percentY)
  const to = new WayPointData(box.getId(), box.getName(), position.percentX, position.percentY)

  const link: Link = await box.links.addLink(new LinkEndData([from], true), new LinkEndData([to], true), false)

  DragManager.startDragWithClickToDropMode(link.getTo())
}
