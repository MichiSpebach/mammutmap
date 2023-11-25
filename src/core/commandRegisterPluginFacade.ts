import { util } from './util/util'
import * as pluginFacade from '../pluginFacade'
import {FileBoxDepthTreeIterator} from '../pluginFacade'
import { BoxWatcher } from './box/BoxWatcher'

let iterator: FileBoxDepthTreeIterator
const boxWatchers: BoxWatcher[] = []

export async function processCommand(command: string): Promise<void> {
  const [commandName, parameter]: string[] = command.split(/ (.+)/, 2)

  switch (commandName) {
    case 'start':
      startIterate()
      return
    case 'printNextBox':
      await printAndWatchNextBox()
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

async function printAndWatchNextBox(): Promise<void> {
  if (await iterator.hasNextOrUnwatch()) {
    const box: pluginFacade.FileBox = await iterator.next()
    boxWatchers.push(await BoxWatcher.newAndWatch(box))
    util.logInfo('next box is '+box.getSrcPath())
  } else {
    util.logInfo('no further boxes to iterate')
  }
}

async function clearWatchedBoxes(): Promise<void> {
  await Promise.all(boxWatchers.map(boxWatcher => boxWatcher.unwatch()))
  util.logInfo('watchedBoxes cleared')
}

async function watchBox(sourcePath: string): Promise<void> {
  const boxWatcher: BoxWatcher|undefined = (await pluginFacade.getRootFolder().getBoxBySourcePathAndRenderIfNecessary(sourcePath)).boxWatcher
  if (!boxWatcher) {
    util.logWarning('box with sourcePath '+sourcePath+' does not exist')
  } else {
    boxWatchers.push(boxWatcher)
    util.logInfo('watching '+(await boxWatcher.get()).getSrcPath())
  }
}

async function unwatchBox(sourcePath: string): Promise<void> {
  const boxWatcher: BoxWatcher|undefined = boxWatchers.find(async boxWatcher => (await boxWatcher.get()).getSrcPath() === sourcePath)
  if (!boxWatcher) {
    util.logWarning('box with sourcePath '+sourcePath+' is not watched by commandLine')
  } else {
    await boxWatcher.unwatch()
    boxWatchers.splice(boxWatchers.indexOf(boxWatcher), 1)
    util.logInfo('unwatched '+sourcePath)
  }
}
