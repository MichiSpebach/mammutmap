import { LinkImplementation, override as overrideLink } from '../dist/box/Link'
import { WayPointData } from '../dist/box/WayPointData'
import { NodeWidget } from '../dist/node/NodeWidget'
import { Box } from '../dist/pluginFacade'
import { applicationMenu, MenuItemFile } from '../dist/pluginFacade'
import { util } from '../dist/util'

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

const colors: string[] = ['green', 'blue', 'yellow', 'orange', 'magenta', 'aqua', 'lime', 'purple', 'teal']

class DidactedLink extends LinkImplementation {

    public static getSuperClass(): typeof LinkImplementation {
        return Object.getPrototypeOf(DidactedLink.prototype).constructor
    }

    public getColor(): string {
        let toBoxId: string
        const dropTargetIfRenderInProgress: Box|NodeWidget|null = this.getTo().getDropTargetIfRenderInProgress()
        if (dropTargetIfRenderInProgress) {
            toBoxId = dropTargetIfRenderInProgress.getId()
        } else {
            const path: WayPointData[] = this.getData().to.path
            toBoxId = path[path.length-1].boxId
        }
        
        const hash: number = toBoxId.charCodeAt(0) + toBoxId.charCodeAt(toBoxId.length/2) + toBoxId.charCodeAt(toBoxId.length-1)
        return colors[hash % colors.length]
    }

}

activate()
