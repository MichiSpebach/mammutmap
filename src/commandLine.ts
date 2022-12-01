import { dom } from './domAdapter'
import { renderManager, RenderPriority } from './RenderManager'
import * as map from './Map'
import { util } from './util'
import * as commandLinePluginFacade from './commandLinePluginFacade'
import * as htmlCursor from './htmlCursor'
import { setCompatibilityTheme } from './styleAdapter'

export function init(): void {
  dom.addKeypressListenerTo('commandLine', 'Enter', processCommand)
}

async function processCommand(command: string): Promise<void> {
  const [commandName, parameter]: string[] = command.split(/ (.+)/, 2)
  dom.setValueTo('commandLine', '')

  switch (commandName) {
    case 'open':
      const folderPath: string = parameter
      util.logInfo('opening '+folderPath)
      await map.searchAndLoadMapCloseTo(folderPath)
      util.logInfo('opening finished')
      return
    case 'close':
      util.logInfo('closing current opened folder')
      await map.unloadAndUnsetMap()
      util.logInfo('closing finished')
      return
    case 'openDevTools':
      util.logInfo('opening developerTools')
      renderManager.openDevTools()
      return
    case 'setCompatibilityTheme':
      await setCompatibilityTheme()
      util.logInfo('activated compatibilityTheme')
      return
    case 'setLogDebugActivated':
      if (parameter === 'true') {
        util.setLogDebugActivated(true)
        util.logInfo('activated debug logging')
      } else if (parameter === 'false') {
        util.setLogDebugActivated(false)
        util.logInfo('deactivated debug logging')
      } else {
        util.logWarning('setLogDebugActivated expects true or false as parameter')
      }
      return
    case 'setHtmlCursorActivated':
      if (parameter === 'true') {
        await htmlCursor.activate()
        util.logInfo('activated htmlCursor')
      } else if (parameter === 'false') {
        await htmlCursor.deactivate()
        util.logInfo('deactivated htmlCursor')
      } else {
        util.logWarning('setHtmlCursorActivated expects true or false as parameter')
      }
      return
    case 'clear':
      await renderManager.setContentTo('log', '', RenderPriority.RESPONSIVE)
      return
    case 'pluginFacade':
      await commandLinePluginFacade.processCommand(parameter)
      return
    default:
      util.logWarning(`unknown command ${command}`)
  }
}
