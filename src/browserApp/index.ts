import * as domAdapter from '../core/renderEngine/domAdapter'
import * as applicationMenu from '../core/applicationMenu/applicationMenu'
import * as pluginLoader from '../core/pluginLoader'
import { mainWidget } from '../core/mainWidget'
import * as fileSystemAdapter from '../core/fileSystemAdapter'
import * as settings from '../core/settings/settings'
import * as contextMenu from '../core/contextMenu'
import { DirectDomAdapter } from '../core/renderEngine/DirectDomAdapter'
import { HtmlApplicationMenu } from '../core/applicationMenu/HtmlApplicationMenu'
import { BrowserFileSystemAdapter } from './BrowserFileSystemAdapter'
import { HtmlContextMenuPopup } from './HtmlContextMenuPopup'
import { searchAndLoadMapCloseTo } from '../core/Map'
import { log } from '../core/logService'
import * as environment from '../core/environmentAdapter'
import { BrowserEnvironmentAdapter } from './BrowserEnvironmentAdapter'

init()

async function init(): Promise<void> {
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      log.errorWithoutThrow(event.reason)
    })

    environment.init(new BrowserEnvironmentAdapter())
    domAdapter.init(new DirectDomAdapter())
    fileSystemAdapter.init(new BrowserFileSystemAdapter())
    await settings.init()
    mainWidget.render()
    contextMenu.init(new HtmlContextMenuPopup())
    await applicationMenu.initAndRender(new HtmlApplicationMenu())
    await pluginLoader.loadPlugins()
    await searchAndLoadMapCloseTo('./mammutmap')
}