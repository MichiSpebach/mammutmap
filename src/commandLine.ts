import { dom } from './domAdapter'
import * as map from './Map'
import * as util from './util'

export function init(): void {
  dom.addKeypressListenerTo('commandLine', 'Enter', processCommand)
}

async function processCommand(command: string): Promise<void> {
  const [commandName, parameter]: string[] = command.split(' ', 2)
  dom.setValueTo('commandLine', '')

  switch (commandName) {
    case 'open':
      const folderPath: string = parameter
      util.logInfo('opening '+folderPath)
      await map.loadAndSetMap(folderPath, folderPath+'/map')
      util.logInfo('opening finished')
      return
    case 'close':
      util.logInfo('closing current opened folder')
      await map.unloadAndUnsetMap()
      util.logInfo('closing finished')
      return
    case 'clear':
      await dom.setContentTo('log', '')
      return
    default:
      util.logWarning(`unknown command ${command}`)
  }
}
