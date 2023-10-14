import { renderManager, RenderPriority } from './RenderManager'
import * as map from './Map'
import * as commandLinePluginFacade from './commandLinePluginFacade'
import * as htmlCursor from './htmlCursor'
import { setCompatibilityTheme } from './styleAdapter'
import { log } from './logService'
import * as indexHtmlIds from './indexHtmlIds'
import { mainWidget } from './mainWidget'

type CommandFunction = (parameter: string) => Promise<void>
const commands: Map<string, CommandFunction> = new Map()

export async function initAndRender(): Promise<void> { // TODO rename or remove
  registerDefaultCommands()
}

export function registerCommand(commandName: string, commandFunction: (parameter: string) => Promise<void>): void {
  if (commands.has(commandName)) {
    log.warning(`commandLine.registerCommand(commandName='${commandName}', commandFunction=${commandFunction}): commandName already registered, overriding it.`)
  }
  commands.set(commandName, commandFunction)
}

export async function processCommand(command: string): Promise<void> {
  const [commandName, parameter]: string[] = command.split(/ (.+)/, 2)

  const commandFunction: CommandFunction|undefined = commands.get(commandName)
  if (commandFunction) {
    await commandFunction(parameter)
    return
  }
  log.warning(`unknown command ${command}`)
}

function registerDefaultCommands(): void {
  commands.set('help', async () => {
    const commandNames: string[] = []
    for (const commandName of commands.keys()) {
      commandNames.push(commandName)
    }
    log.info(`available commands: ${commandNames.join(', ')}`)
  })
  commands.set('clear', async () => {
    await log.clear(RenderPriority.RESPONSIVE)
  })
  commands.set('open', async (parameter: string) => {
    const folderPath: string = parameter
    log.info('opening '+folderPath)
    await map.searchAndLoadMapCloseTo(folderPath)
    log.info('opening finished')
  })
  commands.set('close', async () => {
    log.info('closing current opened folder')
    await map.unloadAndUnsetMap()
    log.info('closing finished')
  })
  commands.set('openDevTools', async () => {
    log.info('opening developerTools')
    renderManager.openDevTools()
  })
  commands.set('setCompatibilityTheme', async () => {
    await setCompatibilityTheme()
    log.info('activated compatibilityTheme')
  })
  commands.set('setLogDebugActivated', async (parameter: string) => {
    if (parameter === 'true') {
      log.setLogDebugActivated(true)
      log.info('activated debug logging')
    } else if (parameter === 'false') {
      log.setLogDebugActivated(false)
      log.info('deactivated debug logging')
    } else {
      log.warning('setLogDebugActivated expects true or false as parameter')
    }
  })
  commands.set('setHtmlCursorActivated', async (parameter: string) => {
    if (parameter === 'true') {
      await htmlCursor.activate()
      log.info('activated htmlCursor')
    } else if (parameter === 'false') {
      await htmlCursor.deactivate()
      log.info('deactivated htmlCursor')
    } else {
      log.warning('setHtmlCursorActivated expects true or false as parameter')
    }
  })
  commands.set('pluginFacade', async (parameter: string) => {
    await commandLinePluginFacade.processCommand(parameter)
  })
}
