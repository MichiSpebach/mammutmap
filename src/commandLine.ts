import { dom } from './domAdapter'
import * as map from './Map'
import * as util from './util'

export function init(): void {
  dom.addKeypressListenerTo('commandLine', 'Enter', processCommand)
}

async function processCommand(command: string): Promise<void> {
  const [commandName, parameter]: string[] = command.split(' ', 2)
  if (commandName === 'open') {
    const folderPath: string = parameter
    util.logInfo('opening '+folderPath)
    await dom.setValueTo('commandLine', '')
    await map.loadAndSetMap(folderPath, folderPath+'/map')
    return
  }
  util.logWarning(`unknown command ${command}`)
}
