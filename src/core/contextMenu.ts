import { util } from './util/util'
import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { FolderBox } from './box/FolderBox'
import { WayPointData } from './mapData/WayPointData'
import { Link } from './link/Link'
import { dragManager } from './DragManager'
import { LinkEndData } from './mapData/LinkEndData'
import { ClientPosition } from './shape/ClientPosition'
import { LocalPosition } from './shape/LocalPosition'
import { BoxData } from './mapData/BoxData'
import { TextInputPopup } from './TextInputPopup'
import { SourcelessBox } from './box/SourcelessBox'
import { NodeData } from './mapData/NodeData'
import { PopupWidget } from './PopupWidget'
import { settings } from './Settings'
import { NodeWidget } from './node/NodeWidget'
import { MenuItem } from './applicationMenu/MenuItem'
import { MenuItemFolder } from './applicationMenu/MenuItemFolder'
import { MenuItemFile } from './applicationMenu/MenuItemFile'

let contextMenuPopup: ContextMenuPopup

export function init(popupImpl: ContextMenuPopup): void {
  contextMenuPopup = popupImpl
}

export interface ContextMenuPopup {
  popup(items: MenuItem[], position: ClientPosition): void
}

const fileBoxMenuItemGenerators: ((box: FileBox) => MenuItem|undefined)[] = []

export function addFileBoxMenuItem(generator: (box: FileBox) => MenuItem|undefined): void {
  fileBoxMenuItemGenerators.push(generator)
}

export function openForFileBox(box: FileBox, position: ClientPosition): void {
  const items: MenuItem[] = [
    buildOpenFileInEditorItem(box),
    buildAddLinkItem(box, position),
    buildAddNodeItem(box, position),
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

  contextMenuPopup.popup(items, position)
}

export function openForFolderBox(box: FolderBox, position: ClientPosition): void {
  const items: MenuItem[] = [
    buildAddLinkItem(box, position),
    buildAddNodeItem(box, position),
    buildRenameBoxItem(box),
    buildAddNewFileItem(box, position),
    buildAddNewFolderItem(box, position),
    buildRemoveOutgoingLinksItem(box)
  ]

  if (settings.getBoolean('developerMode')) {
    items.push(buildDetailsItem('FolderBoxDetails', box))
  }

  contextMenuPopup.popup(items, position)
}

export function openForSourcelessBox(box: SourcelessBox, position: ClientPosition): void {
  const items: MenuItem[] = [
    buildAddLinkItem(box, position),
    buildAddNodeItem(box, position),
    buildRenameBoxItem(box)
  ]

  if (settings.getBoolean('developerMode')) {
    items.push(buildDetailsItem('SourcelessBoxDetails', box))
  }

  contextMenuPopup.popup(items, position)
}

export function openForNode(node: NodeWidget, position: ClientPosition): void {
  const items: MenuItem[] = []

  if (settings.getBoolean('developerMode')) {
    items.push(buildDetailsItem('NodeDetails', node))
  }

  contextMenuPopup.popup(items, position)
}

export function openForLink(link: Link, position: ClientPosition): void {
  const items: MenuItem[] = [
    buildTagLinkItemFolder(link),
    buildRemoveLinkItem(link)
  ]

  if (settings.getBoolean('developerMode')) {
    items.push(buildDetailsItem('LinkDetails', link))
  }

  contextMenuPopup.popup(items, position)
}

function buildOpenFileInEditorItem(box: FileBox): MenuItemFile {
  const command: string = 'code '+box.getSrcPath()
  return new MenuItemFile({label: 'run '+command, click: () => {
    util.runShellCommand(command)
  }})
}

function buildAddLinkItem(box: Box, position: ClientPosition): MenuItemFile {
  return new MenuItemFile({label: 'link from here', click: () => addLinkToBox(box, position)})
}

function buildRemoveOutgoingLinksItem(box: Box): MenuItemFile {
  return new MenuItemFile({label: 'remove all outgoing links', click: () => {
    box.borderingLinks.getOutgoingLinks().forEach(link => link.getManagingBoxLinks().removeLink(link))
  }})
}

function buildAddNodeItem(box: Box, position: ClientPosition): MenuItemFile {
  return new MenuItemFile({label: 'add link node here', click: () => addNodeToBox(box, position)})
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

function buildAddNewFileItem(box: FolderBox, position: ClientPosition): MenuItemFile {
  return new MenuItemFile({label: 'new file', click: async () => {
    const mapData: BoxData = await buildMapDataForNewBox(box, position)
    await box.addNewFileAndSave(mapData.id, mapData)
    //ScaleManager.startWithClickToDropMode(newBox) // TODO: implement
  }})
}

function buildAddNewFolderItem(box: FolderBox, position: ClientPosition): MenuItemFile {
  return new MenuItemFile({label: 'new folder', click: async () => {
    const mapData: BoxData = await buildMapDataForNewBox(box, position)
    await box.addNewFolderAndSave(mapData.id, mapData)
    //ScaleManager.startWithClickToDropMode(newBox) // TODO: implement
  }})
}

async function buildMapDataForNewBox(parentBox: FolderBox, position: ClientPosition): Promise<BoxData> {
  const positionInParentBox: LocalPosition = await parentBox.transform.clientToLocalPosition(position)
  return BoxData.buildNew(positionInParentBox.percentX, positionInParentBox.percentY, 16, 8)
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
    protected formContent(): string {
      // TODO: render this in zoomable map would be cool, introduce ObjectBox|JsonBox for this, or better handled by plugin?
      let html = '<pre style="max-width:1500px;max-height:750px;overflow:auto;">'
      html += util.escapeForHtml(util.stringify(object))
      html += '</pre>'
      return html
    }
  }
}

// TODO: move into Box?
async function addLinkToBox(box: Box, position: ClientPosition): Promise<void> {
  const positionInBox: LocalPosition = await box.transform.clientToLocalPosition(position)
  const fromWayPoint = WayPointData.buildNew(box.getId(), box.getName(), positionInBox.percentX, positionInBox.percentY)
  const toWayPoint = WayPointData.buildNew(box.getId(), box.getName(), positionInBox.percentX, positionInBox.percentY)

  const fromLinkEnd = {mapData: new LinkEndData([fromWayPoint], true)}
  const toLinkEnd = {mapData: new LinkEndData([toWayPoint], true)}
  const link: Link = await box.links.addLink(fromLinkEnd, toLinkEnd, false)

  await dragManager.startDragWithClickToDropMode(link.getTo())
}

async function addNodeToBox(box: Box, position: ClientPosition): Promise<void> {
  const positionInBox: LocalPosition = await box.transform.clientToLocalPosition(position)
  await box.nodes.add(NodeData.buildNew(positionInBox.percentX, positionInBox.percentY))
}
