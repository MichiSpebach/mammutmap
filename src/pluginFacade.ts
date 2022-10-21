import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { FolderBox } from './box/FolderBox'
import { RootFolderBox } from './box/RootFolderBox'
import { Map, map, onMapLoaded, onMapRendered, onMapUnload } from './Map'
import { util } from './util'
import { WayPointData } from './mapData/WayPointData'
import { BoxWatcher } from './box/BoxWatcher'
import { LinkEndData } from './mapData/LinkEndData'
import * as boxFinder from './pluginUtil/boxFinder'
import { Link, LinkImplementation, override as overrideLink } from './link/Link'
import { applicationMenu } from './applicationMenu/applicationMenu'
import { MenuItemFile } from './applicationMenu/MenuItemFile'
import * as contextMenu from './contextMenu/contextMenu'
import { Subscribers } from './util/Subscribers'
import { renderManager } from './RenderManager'
import { LinkLine, override as overrideLinkLine } from './link/LinkLine'
import { ProjectSettings } from './ProjectSettings'
import { mainWidget } from './mainWidget'

export { applicationMenu, contextMenu, MenuItemFile }
export { renderManager, Subscribers }
export { mainWidget }
export { Map, onMapLoaded, onMapRendered, onMapUnload }
export { ProjectSettings }
export { Box, FileBox, RootFolderBox }
export { Link, LinkImplementation, overrideLink, LinkLine, overrideLinkLine }

let boxWatchers: BoxWatcher[] = []

export class Message{
  public constructor(
    public message: string
  ) {}
}

export function getFileBoxIterator(): FileBoxDepthTreeIterator {
  return new FileBoxDepthTreeIterator(getRootFolder())
}

export function getRootFolder(): RootFolderBox|never {
  return getMapOrError().getRootFolder()
}

export function getMapOrError(): Map|never {
  if (!map) {
    util.logError('a folder has to be openend first to execute this plugin')
  }
  return map
}

export function getMap(): Map|Message {
  if (!map) {
    return new Message('No folder/project/map opened.')
  }
  return map
}

export class FileBoxDepthTreeIterator {
  private readonly boxIterators: BoxIterator[]
  private nextBox: FileBox|null

  public constructor(rootBox: FolderBox) {
    this.boxIterators = []
    this.boxIterators.push(new BoxIterator(rootBox.getBoxes()))
    this.nextBox = null
  }

  public async hasNext(): Promise<boolean> {
    await this.prepareNext()
    if (!this.nextBox) {
      clearWatchedBoxes() // TODO: implement better solution
    }
    return this.nextBox !== null
  }

  public async next(): Promise<FileBox | never> {
    await this.prepareNext()
    if (!this.nextBox) {
      util.logError('next() was called, but there are no FileBoxes left, call hasNext() to check if next exists')
    }

    const nextBox = this.nextBox
    this.nextBox = null
    return nextBox;
  }

  private async prepareNext(): Promise<void> {
    if (this.nextBox || this.boxIterators.length === 0) {
      return
    }

    const currentBoxIterator = this.getCurrentBoxIterator()
    if (currentBoxIterator.hasNext()) {
      const nextBox: Box = currentBoxIterator.next()
      await addWatcherAndUpdateRenderFor(nextBox)
      if (nextBox.isFile()) {
        this.nextBox = nextBox as FileBox
      } else if (nextBox.isFolder()) {
        this.boxIterators.push(new BoxIterator((nextBox as FolderBox).getBoxes()))
        await this.prepareNext()
      } else if (nextBox.isSourceless()) {
        await this.prepareNext()
      } else {
        util.logWarning('nextBox (id '+nextBox.getId()+') is neither FileBox nor FolderBox nor SourcelessBox')
        await this.prepareNext()
      }
    } else {
      this.boxIterators.pop()
      await this.prepareNext()
    }
  }

  private getCurrentBoxIterator(): BoxIterator {
    return this.boxIterators[this.boxIterators.length - 1]
  }
}

class BoxIterator {
  private readonly boxes: Box[]
  private nextIndex: number

  public constructor(boxes: Box[]) {
    this.boxes = this.sortBoxesByFilesFirst(boxes)
    this.nextIndex = 0
  }

  private sortBoxesByFilesFirst(boxes: Box[]): Box[] {
    const fileBoxes: Box[] = []
    const folderBoxes: Box[] = []

    for (const box of boxes) {
      if (box.isFile()) {
        fileBoxes.push(box)
      } else {
        folderBoxes.push(box)
      }
    }

    return fileBoxes.concat(folderBoxes)
  }

  public hasNext(): boolean {
    return this.nextIndex < this.boxes.length
  }

  public next(): Box {
    return this.boxes[this.nextIndex++]
  }
}

export async function addLink(fromBox: FileBox, toFilePath: string, options?: {
  onlyReturnWarnings?: boolean
  registerBoxWatchersInsteadOfUnwatch?: boolean
}): Promise<{
  link: Link|undefined,
  linkAlreadyExisted: boolean,
  warnings?: string[]
}> {
  const toReport = await findBoxBySourcePath(toFilePath, fromBox.getParent(), {...options, registerBoxWatcher: options?.registerBoxWatchersInsteadOfUnwatch})
  if (!toReport.boxWatcher) {
    const message: string = 'failed to add link because file for toFilePath "'+toFilePath+'" was not found'
    if (!options?.onlyReturnWarnings) {
      util.logWarning(message)
    }
    const warnings: string[] = toReport.warnings? toReport.warnings.concat(message) : [message]
    return {link: undefined, linkAlreadyExisted: false, warnings}
  }

  const toBox: Box = await toReport.boxWatcher.get()
  
  const {link, linkAlreadyExisted} = await addLinkBetweenBoxes(fromBox, toBox)

  if (!options?.registerBoxWatchersInsteadOfUnwatch) {
    toReport.boxWatcher.unwatch()
  }

  return {link, linkAlreadyExisted, warnings: toReport.warnings}
}

export async function addLinkBetweenBoxes(fromBox: Box, toBox: Box): Promise<{
  link: Link|undefined,
  linkAlreadyExisted: boolean
}> {
  const managingBox: Box = Box.findCommonAncestor(fromBox, toBox).commonAncestor;

  let link: Link|undefined = managingBox.links.getLinkWithEndBoxes(fromBox, toBox)
  const linkAlreadyExisted: boolean = !!link
  if (!link) {
    const fromWayPoint = WayPointData.buildNew(fromBox.getId(), fromBox.getName(), 50, 50)
    const toWayPoint = WayPointData.buildNew(toBox.getId(), toBox.getName(), 50, 50)

    const fromLinkEnd = {mapData: new LinkEndData([fromWayPoint]), linkable: fromBox}
    const toLinkEnd = {mapData: new LinkEndData([toWayPoint]), linkable: toBox}
    link = await managingBox.links.addLink(fromLinkEnd, toLinkEnd, true)
  }

  return {link, linkAlreadyExisted}
}

async function addWatcherAndUpdateRenderFor(box: Box): Promise<void> {
  const boxWatcher = new BoxWatcher(box)
  await box.addWatcherAndUpdateRender(boxWatcher)
  boxWatchers.push(boxWatcher)
}

export async function findBoxBySourcePath(
  path: string, 
  baseOfPath: FolderBox,
  options?: {
    onlyReturnWarnings?: boolean
    registerBoxWatcher?: boolean
  }
): Promise<{boxWatcher?: BoxWatcher, warnings?: string[]}> {
  const report = await boxFinder.findBox(path, baseOfPath, options)

  if (report.boxWatcher && options?.registerBoxWatcher) {
    boxWatchers.push(report.boxWatcher)
  }

  return report
}

export async function clearWatchedBoxes(): Promise<void> {
  while (boxWatchers.length > 0) {
    const boxWatcher: BoxWatcher|undefined = boxWatchers.shift()
    if (boxWatcher) {
      await boxWatcher.unwatch()
    }
  }
}
