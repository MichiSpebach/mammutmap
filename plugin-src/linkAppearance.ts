import { applicationMenu, mainWidget, MenuItemFile, overrideLink, overrideLinkLine } from '../dist/pluginFacade'
import { coreUtil } from '../dist/pluginFacade'
import { DidactedLink } from './linkAppearance/DidactedLink'
import { LinkAppearanceToolbarView } from './linkAppearance/toolbar/LinkAppearanceToolbarView'
import { DidactedLinkLine } from './linkAppearance/DidactedLinkLine'

const deactivateMenuItem: MenuItemFile = new MenuItemFile({label: 'deactivate', click: deactivate})
const activateMenuItem: MenuItemFile = new MenuItemFile({label: 'activate', click: activate})
applicationMenu.addMenuItemTo('linkAppearance.js', deactivateMenuItem)
applicationMenu.addMenuItemTo('linkAppearance.js', activateMenuItem)

async function deactivate(): Promise<void> {
    overrideLink(DidactedLink.getSuperClass())
    overrideLinkLine(DidactedLinkLine.getSuperClass())
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, false)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, true)
    coreUtil.logInfo('deactivated linkAppearance plugin')
}

async function activate(): Promise<void> {
    overrideLink(DidactedLink)
    overrideLinkLine(DidactedLinkLine)
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, true)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, false)
    coreUtil.logInfo('activated linkAppearance plugin')
}

activate()

mainWidget.sidebar.addView(new LinkAppearanceToolbarView('LinkAppearance'))
