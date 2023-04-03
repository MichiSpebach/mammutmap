import * as domAdapter from '../core/domAdapter'
import * as commandLine from '../core/commandLine'
import * as applicationMenu from '../core/applicationMenu/applicationMenu'
import * as pluginLoader from '../core/pluginLoader'
import { mainWidget } from '../core/mainWidget'
import * as fileSystemAdapter from '../core/fileSystemAdapter'
import * as settings from '../core/Settings'
import * as contextMenu from '../core/contextMenu'
import { DirectDomAdapter } from './DirectDomAdapter'
import { HtmlApplicationMenu } from '../core/applicationMenu/HtmlApplicationMenu'
import { BrowserFileSystemAdapter } from './BrowserFileSystemAdapter'
import { HtmlContextMenuPopup } from './HtmlContextMenuPopup'
import { searchAndLoadMapCloseTo } from '../core/Map'

init()

async function init(): Promise<void> {
    //processing.init(new BrowserProcessingAdapter()) TODO
    domAdapter.init(new DirectDomAdapter())
    fileSystemAdapter.init(new BrowserFileSystemAdapter())
    await settings.init()
    mainWidget.render()
    commandLine.init()
    contextMenu.init(new HtmlContextMenuPopup())
    await applicationMenu.initAndRender(new HtmlApplicationMenu())
    await pluginLoader.loadPlugins()
    await searchAndLoadMapCloseTo('./mammutmap')
}