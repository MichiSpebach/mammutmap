import { Dirent } from 'fs'
import { MenuItem } from 'electron'
import { util } from './util'
import { fileSystem } from './fileSystemAdapter'
import { applicationMenu } from './applicationMenu'

const pluginFolderName: string = 'plugin'
const pluginFolderPath: string = './'+pluginFolderName
const alternativePluginFolderPath: string = './resources/app/'+pluginFolderName

export async function loadPlugins(): Promise<void> {
  if (!await fileSystem.doesDirentExist(pluginFolderPath)) {
    await tryToSymlinkToAlternativeFolder()
  }
  
  if (await fileSystem.doesDirentExist(pluginFolderPath)) {
    await loadPluginsFrom(pluginFolderPath)
  } else if (await fileSystem.doesDirentExist(alternativePluginFolderPath)) {
    await loadPluginsFrom(alternativePluginFolderPath)
  } else {
    util.logWarning(`Failed to load plugins because: found neither '${pluginFolderPath}' nor '${alternativePluginFolderPath}'.`)
  }
}

async function tryToSymlinkToAlternativeFolder(): Promise<void> {
  if (await fileSystem.doesDirentExist(alternativePluginFolderPath)) {
    util.logInfo(pluginFolderPath+' not found, make link folder for convenience that links to '+alternativePluginFolderPath+'.')
    await fileSystem.symlink(alternativePluginFolderPath, pluginFolderPath, 'dir')
  }
}

async function loadPluginsFrom(pluginFolderPath: string): Promise<void> {
  util.logInfo('load plugins from '+pluginFolderPath)

  const entries: Dirent[] = await fileSystem.readdir(pluginFolderPath)
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue
    }
    if (!entry.name.endsWith('.js')) {
      util.logWarning('cannot load '+entry.name+' as plugin because only .js files are supported')
      continue
    }
    await loadPlugin(entry.name)
  }

  util.logInfo('plugins loaded')
}

async function loadPlugin(fileName: string): Promise<void> {
  util.logInfo('load '+fileName+' plugin')
  applicationMenu.addMenuItemToPlugins(new MenuItem({id: fileName, label: fileName, submenu:[]}))

  await import(util.joinPaths(['../', pluginFolderName, fileName]))
    .then(() => util.logInfo(fileName+' plugin loaded'))
    .catch(error => util.logWarning('failed to load '+fileName+' plugin, reason: '+error))
}
