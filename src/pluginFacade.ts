import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { FolderBox } from './box/FolderBox'
import { RootFolderBox } from './box/RootFolderBox'
import { map } from './Map'
import { util } from './util'
import { WayPointData } from './box/WayPointData'
import { BoxWatcher } from './box/BoxWatcher'
import { LinkEndData } from './box/LinkEndData'

export { Box, FileBox, RootFolderBox }

let boxWatchers: BoxWatcher[] = []

export function getFileBoxIterator(): FileBoxDepthTreeIterator {
  return new FileBoxDepthTreeIterator(getRootFolder())
}

export function getRootFolder(): RootFolderBox|never {
  if (!map) {
    util.logError('a folder has to be openend first to execute this plugin')
  }
  return map.getRootFolder()
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

export async function addLink(fromFilePath: string, toFilePath: string, registerBoxWatchersInsteadOfUnwatch?: boolean): Promise<void> {
  const from: BoxWatcher|undefined = await getBoxBySourcePath(fromFilePath, {registerBoxWatcher: registerBoxWatchersInsteadOfUnwatch})
  if (!from) {
    util.logWarning('failed to add link because file for fromFilePath "'+fromFilePath+'" was not found')
    return
  }
  const to: BoxWatcher|undefined = await getBoxBySourcePath(toFilePath, {registerBoxWatcher: registerBoxWatchersInsteadOfUnwatch})
  if (!to) {
    util.logWarning('failed to add link because file for toFilePath "'+toFilePath+'" was not found')
    return
  }

  const fromBox: Box = await from.get()
  const toBox: Box = await to.get()
  const managingBox: Box = Box.findCommonAncestor(fromBox, toBox).commonAncestor;
  if (managingBox.links.hasLinkWithEndBoxes(fromBox, toBox)) {
    return
  }

  const fromWayPoint = WayPointData.buildNew(fromBox.getId(), fromBox.getName(), 50, 50)
  const toWayPoint = WayPointData.buildNew(toBox.getId(), toBox.getName(), 50, 50)

  const fromLinkEnd = {mapData: new LinkEndData([fromWayPoint]), linkable: fromBox}
  const toLinkEnd = {mapData: new LinkEndData([toWayPoint]), linkable: toBox}
  await managingBox.links.addLink(fromLinkEnd, toLinkEnd, true)

  if (!registerBoxWatchersInsteadOfUnwatch) {
    from.unwatch()
    to.unwatch()
  }
}

async function addWatcherAndUpdateRenderFor(box: Box): Promise<void> {
  const boxWatcher = new BoxWatcher(box)
  await box.addWatcherAndUpdateRender(boxWatcher)
  boxWatchers.push(boxWatcher)
}

async function getBoxBySourcePath(path: string, options?: {registerBoxWatcher?: boolean}): Promise<BoxWatcher|undefined> {
  const boxWatcher: BoxWatcher|undefined = await getRootFolder().getBoxBySourcePathAndRenderIfNecessary(path)
  if (!boxWatcher) {
    return undefined
  }
  if (options?.registerBoxWatcher) {
    boxWatchers.push(boxWatcher)
  }
  return boxWatcher
}

export async function clearWatchedBoxes(): Promise<void> {
  while (boxWatchers.length > 0) {
    const boxWatcher: BoxWatcher|undefined = boxWatchers.shift()
    if (boxWatcher) {
      await boxWatcher.unwatch()
    }
  }
}
