import { util } from './util'
import * as pluginFacade from './pluginFacade'
import {FileBoxDepthTreeIterator} from './pluginFacade'
import { BoxWatcher } from './box/BoxWatcher'

let iterator: FileBoxDepthTreeIterator
let boxWatchers: Map<string, BoxWatcher> = new Map()

export async function processCommand(command: string): Promise<void> {
  const [commandName, parameter]: string[] = command.split(/ (.+)/, 2)

  switch (commandName) {
    case 'start':
      startIterate()
      return
    case 'printNextBox':
      await printNextBox()
      return
    case 'clearWatchedBoxes':
      await clearWatchedBoxes()
      return
    case 'watchBox':
      await watchBox(parameter)
      return
    case 'unwatchBox':
      await unwatchBox(parameter)
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

async function watchBox(sourcePath: string): Promise<void> {
  const boxWatcher: BoxWatcher|undefined = await pluginFacade.getRootFolder().getBoxBySourcePathAndRenderIfNecessary(sourcePath)
  if (!boxWatcher) {
    util.logWarning('box with sourcePath '+sourcePath+' does not exist')
  } else {
    boxWatchers.set(sourcePath, boxWatcher)
    util.logInfo('watching '+(await boxWatcher.get()).getSrcPath())
  }
}

async function unwatchBox(sourcePath: string): Promise<void> {
  const boxWatcher: BoxWatcher|undefined = boxWatchers.get(sourcePath)
  if (!boxWatcher) {
    util.logWarning('box with sourcePath '+sourcePath+' is not watched by commandLine')
  } else {
    await boxWatcher.unwatch()
    boxWatchers.delete(sourcePath)
    util.logInfo('unwatched '+sourcePath)
  }
}
