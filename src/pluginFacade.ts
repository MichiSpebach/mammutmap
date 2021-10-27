import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { FolderBox } from './box/FolderBox'
import { RootFolderBox } from './box/RootFolderBox'
import { boxManager } from './box/BoxManager'
import { map } from './Map'
import * as util from './util'
import { WayPointData } from './box/WayPointData'

export { Box, FileBox, RootFolderBox }

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

  public hasNext(): boolean {
    this.prepareNext()
    return this.nextBox != null
  }

  public next(): FileBox|never {
    this.prepareNext()
    if (!this.nextBox) {
      util.logError('next() was called, but there are no FileBoxes left, call hasNext() to check if next exists')
    }

    const nextBox = this.nextBox
    this.nextBox = null
    return nextBox;
  }

  private prepareNext(): void {
    if (this.nextBox || this.boxIterators.length === 0) {
      return
    }

    const currentBoxIterator = this.getCurrentBoxIterator()
    if (currentBoxIterator.hasNext()) {
      const nextBox: Box = currentBoxIterator.next()
      if (nextBox.isFile()) {
        this.nextBox = nextBox as FileBox
      } else if (nextBox.isFolder()) {
        this.boxIterators.push(new BoxIterator((nextBox as FolderBox).getBoxes()))
        this.prepareNext()
      } else {
        util.logError('nextBox (id '+nextBox.getId()+') is neither FileBox nor FolderBox')
      }
    } else {
      this.boxIterators.pop()
      this.prepareNext()
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
    this.boxes = boxes
    this.nextIndex = 0
  }

  public hasNext(): boolean {
    return this.nextIndex < this.boxes.length
  }

  public next(): Box {
    return this.boxes[this.nextIndex++]
  }
}

export async function addLink(fromFilePath: string, toFilePath: string): Promise<void> {
  const from: Box|undefined = boxManager.getBoxBySourcePathIfExists(fromFilePath)
  if (!from) {
    util.logWarning('failed to add link because file for fromFilePath "'+fromFilePath+'" was not found')
    return
  }
  const to: Box|undefined = boxManager.getBoxBySourcePathIfExists(toFilePath)
  if (!to) {
    util.logWarning('failed to add link because file for toFilePath "'+toFilePath+'" was not found')
    return
  }

  const managingBox: Box = Box.findCommonAncestor(from, to).commonAncestor;
  if (managingBox.links.hasLinkWithEndBoxes(from, to)) {
    return
  }

  const fromWayPoint = new WayPointData(from.getId(), from.getName(), 50, 50)
  const toWayPoint = new WayPointData(to.getId(), to.getName(), 50, 50)

  await managingBox.links.addLink(fromWayPoint, toWayPoint, true)
}
