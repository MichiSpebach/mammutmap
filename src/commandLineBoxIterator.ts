import * as util from './util'
import * as pluginFacade from './pluginFacade'
import {FileBoxDepthTreeIterator} from './pluginFacade'

let iterator: FileBoxDepthTreeIterator

export async function processCommand(command: string): Promise<void> {
  switch (command) {
    case 'start':
      startIterate()
      return
    case 'printNextBox':
      await printNextBox()
      return
    case 'clearWatchedBoxes':
      await clearWatchedBoxes()
      return
    default:
      util.logWarning(`unknown boxIterator command ${command}`)
  }
}

function startIterate(): void {
  iterator = pluginFacade.getFileBoxIterator()
  util.logInfo('boxIterator ready')
}

async function printNextBox(): Promise<void> {
  if (await iterator.hasNext()) {
    const box: pluginFacade.FileBox = await iterator.next()
    util.logInfo('next box is '+box.getSrcPath())
  } else {
    util.logInfo('no further boxes to iterate')
  }
}

async function clearWatchedBoxes(): Promise<void> {
  await pluginFacade.clearWatchedBoxes()
  util.logInfo('watchedBoxes cleared')
}
