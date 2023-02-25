import { applicationMenu, mainWidget, MenuItemFile, overrideLink, overrideLinkLine } from '../dist/pluginFacade'
import { coreUtil } from '../dist/pluginFacade'
import { DidactedLink } from './linkDidactor/DidactedLink'
import { LinkDidactorToolbarView } from './linkDidactor/toolbar/LinkDidactorToolbarView'
import { DidactedLinkLine } from './linkDidactor/DidactedLinkLine'

const deactivateMenuItem: MenuItemFile = new MenuItemFile({label: 'deactivate', click: deactivate})
const activateMenuItem: MenuItemFile = new MenuItemFile({label: 'activate', click: activate})
applicationMenu.addMenuItemTo('linkDidactor.js', deactivateMenuItem)
applicationMenu.addMenuItemTo('linkDidactor.js', activateMenuItem)

async function deactivate(): Promise<void> {
    overrideLink(DidactedLink.getSuperClass())
    overrideLinkLine(DidactedLinkLine.getSuperClass())
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, false)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, true)
    coreUtil.logInfo('deactivated linkDidactor plugin')
}

async function activate(): Promise<void> {
    overrideLink(DidactedLink)
    overrideLinkLine(DidactedLinkLine)
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, true)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, false)
    coreUtil.logInfo('activated linkDidactor plugin')
}

activate()

mainWidget.sidebar.addView(new LinkDidactorToolbarView('LinkDidactor'))
