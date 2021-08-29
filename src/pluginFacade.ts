import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { RootFolderBox } from './box/RootFolderBox'
import { boxManager } from './box/BoxManager'
import { map } from './Map'
import * as util from './util'
import { WayPointData } from './box/WayPointData'

export { Box, FileBox, RootFolderBox }

export function getFileBoxIterator(): FileBoxIterator {
  return new FileBoxIterator(getFileBoxes())
}

function getFileBoxes(): FileBox[] {
  const fileBoxes: FileBox[] = []
  getBoxes().forEach((box: Box) => {
    if (box instanceof FileBox) {
      fileBoxes.push(box)
    }
  })
  return fileBoxes
}

function getBoxes(): Box[] {
  return getRootFolder().getBoxes()
}

export function getRootFolder(): RootFolderBox|never {
  if (!map) {
    util.logError('a folder has to be openend first to execute this plugin')
  }
  return map.getRootFolder()
}

export class FileBoxIterator { // TODO: real implementation that only takes rootBox and traverses tree

  private readonly boxes: FileBox[]
  private nextIndex: number

  public constructor(boxes: FileBox[]) {
    this.boxes = boxes
    this.nextIndex = 0
  }

  public hasNext(): boolean {
    return this.nextIndex < this.boxes.length
  }

  public next(): FileBox {
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

  await managingBox.links.addLink(fromWayPoint, toWayPoint)
}
