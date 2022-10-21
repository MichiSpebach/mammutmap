import { util } from '../util'
import { Box } from '../box/Box'
import { FileBox } from '../box/FileBox'
import { FolderBox } from '../box/FolderBox'
import { WayPointData } from '../mapData/WayPointData'
import { Link } from '../link/Link'
import { DragManager } from '../DragManager'
import { LinkEndData } from '../mapData/LinkEndData'
import { ClientPosition, LocalPosition } from '../box/Transform'
import { BoxData } from '../mapData/BoxData'
import { TextInputPopup } from '../TextInputPopup'
import { SourcelessBox } from '../box/SourcelessBox'
import { NodeData } from '../mapData/NodeData'
import { PopupWidget } from '../PopupWidget'
import { settings } from '../Settings'
import { NodeWidget } from '../node/NodeWidget'
import { MenuItem } from '../applicationMenu/MenuItem'
import { MenuItemFolder } from '../applicationMenu/MenuItemFolder'
import { MenuItemFile } from '../applicationMenu/MenuItemFile'
import { ElectronContextMenu } from './ElectronContextMenu'

const fileBoxMenuItemGenerators: ((box: FileBox) => MenuItem|undefined)[] = []

export function addFileBoxMenuItem(generator: (box: FileBox) => MenuItem|undefined): void {
  fileBoxMenuItemGenerators.push(generator)
}

export function openForFileBox(box: FileBox, clientX: number, clientY: number): void {
  const items: MenuItem[] = [
    buildOpenFileInEditorItem(box),
    buildAddLinkItem(box, clientX, clientY),
    buildAddNodeItem(box, clientX, clientY),
    buildRenameBoxItem(box),
    buildRemoveOutgoingLinksItem(box)
  ]

  if (settings.getBoolean('developerMode')) {
    items.push(buildDetailsItem('FileBoxDetails', box))
  }

  fileBoxMenuItemGenerators.forEach(async generator => {
    const menuItem: MenuItem|undefined = generator(box)
    if (menuItem) {
      items.push(menuItem)
    }
  })

  popupMenu(items)
}

export function openForFolderBox(box: FolderBox, clientX: number, clientY: number): void {
  const items: MenuItem[] = [
    buildAddLinkItem(box, clientX, clientY),
    buildAddNodeItem(box, clientX, clientY),
    buildRenameBoxItem(box),
    buildAddNewFileItem(box, clientX, clientY),
    buildAddNewFolderItem(box, clientX, clientY),
    buildRemoveOutgoingLinksItem(box)
  ]

  if (settings.getBoolean('developerMode')) {
    items.push(buildDetailsItem('FolderBoxDetails', box))
  }

  popupMenu(items)
}

export function openForSourcelessBox(box: SourcelessBox, clientX: number, clientY: number): void {
  const items: MenuItem[] = [
    buildAddLinkItem(box, clientX, clientY),
    buildAddNodeItem(box, clientX, clientY),
    buildRenameBoxItem(box)
  ]

  if (settings.getBoolean('developerMode')) {
    items.push(buildDetailsItem('SourcelessBoxDetails', box))
  }

  popupMenu(items)
}

export function openForNode(node: NodeWidget, clientX: number, clientY: number): void {
  const items: MenuItem[] = []

  if (settings.getBoolean('developerMode')) {
    items.push(buildDetailsItem('NodeDetails', node))
  }

  popupMenu(items)
}

export function openForLink(link: Link, clientX: number, clientY: number): void {
  const items: MenuItem[] = [
    buildTagLinkItemFolder(link),
    buildRemoveLinkItem(link)
  ]

  if (settings.getBoolean('developerMode')) {
    items.push(buildDetailsItem('LinkDetails', link))
  }

  popupMenu(items)
}

function buildOpenFileInEditorItem(box: FileBox): MenuItemFile {
  const command: string = 'code '+box.getSrcPath()
  return new MenuItemFile({label: 'run '+command, click: () => {
    util.runShellCommand(command)
  }})
}

function buildAddLinkItem(box: Box, clientX: number, clientY: number): MenuItemFile {
  return new MenuItemFile({label: 'link from here', click: () => addLinkToBox(box, clientX, clientY)})
}

function buildRemoveOutgoingLinksItem(box: Box): MenuItemFile {
  return new MenuItemFile({label: 'remove all outgoing links', click: () => {
    box.borderingLinks.getOutgoingLinks().forEach(link => link.getManagingBoxLinks().removeLink(link))
  }})
}

function buildAddNodeItem(box: Box, clientX: number, clientY: number): MenuItemFile {
  return new MenuItemFile({label: 'add link node here', click: () => addNodeToBox(box, new ClientPosition(clientX, clientY))})
}

function buildTagLinkItemFolder(link: Link): MenuItemFolder {
  let tags: string[] = link.getManagingBox().getProjectSettings().getLinkTagNamesWithDefaults()

  for (const includedTag of link.getTags()) {
    if (!tags.find(tag => tag === includedTag)) {
      util.logWarning('Corrupted projectSettings detected, expected all linkTags to be registered in projectSettings, but '+includedTag+' was not.')
      link.getManagingBox().getProjectSettings().countUpLinkTagAndSave(includedTag)
      tags.push(includedTag)
    }
  }

  const items: MenuItem[] =  tags.map(tag => buildTagLinkItem(link, tag))
  items.push(buildAddOtherTagLinkItem(link))

  return new MenuItemFolder({label: 'tag', submenu: items})
}

function buildAddOtherTagLinkItem(link: Link): MenuItemFile {
  return new MenuItemFile({label: 'other...', click: async () => {
    const fromBoxName: string = link.from.getRenderedTargetBox().getName()
    const toBoxName: string = link.to.getRenderedTargetBox().getName()
    const tagName: string|undefined = await TextInputPopup.buildAndRenderAndAwaitResolve(`tag link ${link.getId()} between ${fromBoxName} and ${toBoxName}`, '')
    if (tagName) {
      link.addTag(tagName)
    } else {
      util.logInfo('Dialog to add tag to link was closed without input.')
    }
  }})
}

function buildTagLinkItem(link: Link, tag: string): MenuItemFile {
  const tagIncluded: boolean = link.includesTag(tag)
  return new MenuItemFile({
    label: tagIncluded ? '✓ '+tag : '    '+tag,
    click: tagIncluded ? () => link.removeTag(tag) : () => link.addTag(tag)
  })
}

function buildRemoveLinkItem(link: Link): MenuItemFile {
  return new MenuItemFile({label: 'remove link', click: () => link.getManagingBoxLinks().removeLink(link)})
}

function buildRenameBoxItem(box: Box): MenuItemFile {
  return new MenuItemFile({label: 'rename', click: async () => {
    const newName: string|undefined = await TextInputPopup.buildAndRenderAndAwaitResolve('Rename Box', box.getName())
    if (newName) {
      await box.rename(newName)
    }
  }})
}

function buildAddNewFileItem(box: FolderBox, clientX: number, clientY: number): MenuItemFile {
  return new MenuItemFile({label: 'new file', click: async () => {
    const mapData: BoxData = await buildMapDataForNewBox(box, clientX, clientY)
    await box.addNewFileAndSave(mapData.id, mapData)
    //ScaleManager.startWithClickToDropMode(newBox) // TODO: implement
  }})
}

function buildAddNewFolderItem(box: FolderBox, clientX: number, clientY: number): MenuItemFile {
  return new MenuItemFile({label: 'new folder', click: async () => {
    const mapData: BoxData = await buildMapDataForNewBox(box, clientX, clientY)
    await box.addNewFolderAndSave(mapData.id, mapData)
    //ScaleManager.startWithClickToDropMode(newBox) // TODO: implement
  }})
}

async function buildMapDataForNewBox(parentBox: FolderBox, clientX: number, clientY: number): Promise<BoxData> {
  const position: LocalPosition = await parentBox.transform.clientToLocalPosition(new ClientPosition(clientX, clientY))
  return BoxData.buildNew(position.percentX, position.percentY, 16, 8)
}

function buildDetailsItem(title: string, object: any): MenuItemFile {
  return new MenuItemFile({
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

function popupMenu(items: MenuItem[]): void {
  new ElectronContextMenu(items).popup()
  // TODO: implement HtmlContextMenu for browser mode
}
