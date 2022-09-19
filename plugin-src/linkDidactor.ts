import { override as overrideLink } from '../dist/box/Link'
import { applicationMenu, MenuItemFile } from '../dist/pluginFacade'
import { util } from '../dist/util'
import { DidactedLink } from './linkDidactor/DidactedLink'
import { sidebarWidget } from '../dist/toolbars/sidebarWidget'
import { LinkDidactorToolbarView } from './linkDidactor/toolbar/LinkDidactorToolbarView'

const deactivateMenuItem: MenuItemFile = new MenuItemFile({label: 'deactivate', click: deactivate})
const activateMenuItem: MenuItemFile = new MenuItemFile({label: 'activate', click: activate})
applicationMenu.addMenuItemTo('linkDidactor.js', deactivateMenuItem)
applicationMenu.addMenuItemTo('linkDidactor.js', activateMenuItem)

async function deactivate(): Promise<void> {
    overrideLink(DidactedLink.getSuperClass())
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, false)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, true)
    util.logInfo('deactivated linkDidactor plugin')
}

async function activate(): Promise<void> {
    overrideLink(DidactedLink)
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, true)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, false)
    util.logInfo('activated linkDidactor plugin')
}

activate()

sidebarWidget.addView(new LinkDidactorToolbarView('LinkDidactor'))
