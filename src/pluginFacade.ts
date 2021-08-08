import { Box } from './box/Box'
import { FileBox } from './box/FileBox'
import { RootFolderBox } from './box/RootFolderBox'
import { map } from './Map'
import * as util from './util'

export { Box, FileBox, RootFolderBox }

export function getFileBoxes(): FileBox[] {
  const fileBoxes: FileBox[] = []
  getBoxes().forEach((box: Box) => {
    if (box instanceof FileBox) {
      fileBoxes.push(box)
    }
  })
  return fileBoxes
}

export function getBoxes(): Box[] {
  return getRootFolder().getBoxes()
}

export function getRootFolder(): RootFolderBox|never {
  if (!map) {
    util.logError('a folder has to be openend first to execute this plugin')
  }
  return map.getRootFolder()
}
