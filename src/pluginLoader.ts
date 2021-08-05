import * as util from './util'
import * as fileSystem from './fileSystemAdapter'
import * as applicationMenu from './applicationMenu'
import { Dirent } from 'fs'

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
    await import('../plugin/'+entry.name)
      .then(() => util.logInfo(entry.name+' plugin loaded'))
      .catch(error => util.logWarning('failed to load '+entry.name+' plugin, reason: '+error))
  }

  util.logInfo('plugins loaded')
}
