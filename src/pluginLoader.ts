import { Dirent } from 'fs'
import { MenuItem } from 'electron'
import { util } from './util'
import { fileSystem } from './fileSystemAdapter'
import * as applicationMenu from './applicationMenu'

export async function loadPlugins(): Promise<void> {
  util.logInfo('load plugins')

  const entries: Dirent[] = await fileSystem.readdir('./plugin')
  for (const entry of entries) {
    if (!entry.isFile()) {
      continue
    }
    if (!entry.name.endsWith('.js')) {
      util.logWarning('cannot load '+entry.name+' as plugin because only .js files are supported')
      continue
    }

    util.logInfo('load '+entry.name+' plugin')
    applicationMenu.addMenuItemToPlugins(new MenuItem({id: entry.name, label: entry.name, submenu:[]}))
    await import('../plugin/'+entry.name)
      .then(() => util.logInfo(entry.name+' plugin loaded'))
      .catch(error => util.logWarning('failed to load '+entry.name+' plugin, reason: '+error))
  }

  util.logInfo('plugins loaded')
}
