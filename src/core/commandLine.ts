import { dom } from './domAdapter'
import { renderManager, RenderPriority } from './RenderManager'
import * as map from './Map'
import * as commandLinePluginFacade from './commandLinePluginFacade'
import * as htmlCursor from './htmlCursor'
import { setCompatibilityTheme } from './styleAdapter'
import { log } from './logService'

export function init(): void {
  dom.addKeydownListenerTo('commandLine', 'Enter', processCommand)
}

async function processCommand(command: string): Promise<void> {
  const [commandName, parameter]: string[] = command.split(/ (.+)/, 2)
  dom.setValueTo('commandLine', '')

  switch (commandName) {
    case 'open':
      const folderPath: string = parameter
      log.info('opening '+folderPath)
      await map.searchAndLoadMapCloseTo(folderPath)
      log.info('opening finished')
      return
    case 'close':
      log.info('closing current opened folder')
      await map.unloadAndUnsetMap()
      log.info('closing finished')
      return
    case 'openDevTools':
      log.info('opening developerTools')
      renderManager.openDevTools()
      return
    case 'setCompatibilityTheme':
      await setCompatibilityTheme()
      log.info('activated compatibilityTheme')
      return
    case 'setLogDebugActivated':
      if (parameter === 'true') {
        log.setLogDebugActivated(true)
        log.info('activated debug logging')
      } else if (parameter === 'false') {
        log.setLogDebugActivated(false)
        log.info('deactivated debug logging')
      } else {
        log.warning('setLogDebugActivated expects true or false as parameter')
      }
      return
    case 'setHtmlCursorActivated':
      if (parameter === 'true') {
        await htmlCursor.activate()
        log.info('activated htmlCursor')
      } else if (parameter === 'false') {
        await htmlCursor.deactivate()
        log.info('deactivated htmlCursor')
      } else {
        log.warning('setHtmlCursorActivated expects true or false as parameter')
      }
      return
    case 'clear':
      await renderManager.setContentTo('log', '', RenderPriority.RESPONSIVE)
      return
    case 'pluginFacade':
      await commandLinePluginFacade.processCommand(parameter)
      return
    default:
      log.warning(`unknown command ${command}`)
  }
}
