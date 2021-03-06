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
import { SourcelessBox } from './box/SourcelessBox'
import { NodeData } from './mapData/NodeData'
import { PopupWidget } from './PopupWidget'
import { settings } from './Settings'
import { NodeWidget } from './node/NodeWidget'

const fileBoxMenuItemGenerators: ((box: FileBox) => {label: string, action: () => void} | undefined)[] = []

export function addFileBoxMenuItem(generator: (box: FileBox) => {label: string, action: () => void} | undefined): void {
  fileBoxMenuItemGenerators.push(generator)
}

export function openForFileBox(box: FileBox, clientX: number, clientY: number): void {
  const command: string = 'code '+box.getSrcPath()
  const template: any = [
    {
      label: 'run '+command,
      click: () => {
        util.runShellCommand(command)
      }
    }
  ]
  const menu = Menu.buildFromTemplate(template)
  menu.append(buildAddLinkItem(box, clientX, clientY))
  menu.append(buildAddNodeItem(box, clientX, clientY))
  menu.append(buildRenameBoxItem(box))
  if (settings.getBoolean('developerMode')) {
    menu.append(buildDetailsItem('FileBoxDetails', box))
  }

  fileBoxMenuItemGenerators.forEach(async generator => {
    const menuItemParams: {label: string, action: () => void} | undefined = generator(box)
    if (menuItemParams) {
      menu.append(new MenuItem({label: menuItemParams.label, click: menuItemParams.action}))
    }
  })
  
  menu.popup()
}

export function openForFolderBox(box: FolderBox, clientX: number, clientY: number): void {
  const menu = new Menu()
  menu.append(buildAddLinkItem(box, clientX, clientY))
  menu.append(buildAddNodeItem(box, clientX, clientY))
  menu.append(buildRenameBoxItem(box))
  menu.append(buildAddNewFileItem(box, clientX, clientY))
  menu.append(buildAddNewFolderItem(box, clientX, clientY))
  if (settings.getBoolean('developerMode')) {
    menu.append(buildDetailsItem('FolderBoxDetails', box))
  }
  menu.popup()
}

export function openForSourcelessBox(box: SourcelessBox, clientX: number, clientY: number): void {
  const menu = new Menu()
  menu.append(buildAddLinkItem(box, clientX, clientY))
  menu.append(buildAddNodeItem(box, clientX, clientY))
  menu.append(buildRenameBoxItem(box))
  if (settings.getBoolean('developerMode')) {
    menu.append(buildDetailsItem('SourcelessBoxDetails', box))
  }
  menu.popup()
}

export function openForNode(node: NodeWidget, clientX: number, clientY: number): void {
  const menu = new Menu()
  if (settings.getBoolean('developerMode')) {
    menu.append(buildDetailsItem('NodeDetails', node))
  }
  menu.popup()
}

export function openForLink(link: Link, clientX: number, clientY: number): void {
  const menu = new Menu()
  menu.append(buildHideOrShowLinkItem(link))
  menu.append(buildRemoveLinkItem(link))
  if (settings.getBoolean('developerMode')) {
    menu.append(buildDetailsItem('LinkDetails', link))
  }
  menu.popup()
}

function buildAddLinkItem(box: Box, clientX: number, clientY: number): MenuItem {
  return new MenuItem({label: 'link from here', click: () => addLinkToBox(box, clientX, clientY)})
}

function buildAddNodeItem(box: Box, clientX: number, clientY: number): MenuItem {
  return new MenuItem({label: 'add link node here', click: () => addNodeToBox(box, new ClientPosition(clientX, clientY))})
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

function buildDetailsItem(title: string, object: any): MenuItem {
  return new MenuItem({
    label: 'details',
    click: () => {
      buildDetailsPopupWidget(title, object).render()
    }
  })
}

function buildDetailsPopupWidget(title: string, object: any): PopupWidget {
  // TODO: move to own file
  return new class extends PopupWidget {
    public constructor() {
      super(util.generateId()+title, title)
    }
    protected formContentHtml(): string {
      // TODO: render this in zoomable map would be cool, introduce ObjectBox|JsonBox for this, or better handled by plugin?
      let html = '<pre style="max-width:1500px;max-height:750px;overflow:auto;">'
      html += util.escapeForHtml(util.stringify(object))
      html += '</pre>'
      return html
    }
    protected afterRender(): Promise<void> {
      return Promise.resolve()
    }
    protected beforeUnrender(): Promise<void> {
      return Promise.resolve()
    }
  }
}

// TODO: move into Box?
async function addLinkToBox(box: Box, clientX: number, clientY: number): Promise<void> {
  const position: LocalPosition = await box.transform.clientToLocalPosition(new ClientPosition(clientX, clientY))
  const fromWayPoint = WayPointData.buildNew(box.getId(), box.getName(), position.percentX, position.percentY)
  const toWayPoint = WayPointData.buildNew(box.getId(), box.getName(), position.percentX, position.percentY)

  const fromLinkEnd = {mapData: new LinkEndData([fromWayPoint], true)}
  const toLinkEnd = {mapData: new LinkEndData([toWayPoint], true)}
  const link: Link = await box.links.addLink(fromLinkEnd, toLinkEnd, false)

  DragManager.startDragWithClickToDropMode(link.getTo())
}

async function addNodeToBox(box: Box, position: ClientPosition): Promise<void> {
  const positionInBox: LocalPosition = await box.transform.clientToLocalPosition(position)
  await box.nodes.add(NodeData.buildNew(positionInBox.percentX, positionInBox.percentY))
}
