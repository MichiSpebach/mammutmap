import { Link } from '../dist/box/Link'
import { WayPointData } from '../dist/box/WayPointData'
import { NodeWidget } from '../dist/node/NodeWidget'
import { Box } from '../dist/pluginFacade'
import { applicationMenu } from '../dist/applicationMenu'
import { MenuItemFile } from '../dist/applicationMenu/MenuItemFile'
import { util } from '../dist/util'

const deactivateMenuItem: MenuItemFile = new MenuItemFile({label: 'deactivate', click: deactivate})
const activateMenuItem: MenuItemFile = new MenuItemFile({label: 'activate', click: activate})
applicationMenu.addMenuItemTo('linkDidactor.js', deactivateMenuItem)
applicationMenu.addMenuItemTo('linkDidactor.js', activateMenuItem)

async function deactivate(): Promise<void> {
    DidactedLink.deactivateAndPlugout()
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, false)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, true)
    util.logInfo('deactivated linkDidactor plugin')
}

async function activate(): Promise<void> {
    DidactedLink.activateAndPlugin()
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, true)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, false)
    util.logInfo('activated linkDidactor plugin')
}

const colors: string[] = ['green', 'blue', 'yellow', 'orange', 'magenta', 'aqua', 'lime', 'purple', 'teal']

class DidactedLink extends Link {

    private static getColorBackup: () => string

    public static activateAndPlugin(): void {
        this.getColorBackup = Link.prototype.getColor
        Link.prototype.getColor = DidactedLink.prototype.getColor
    }

    public static deactivateAndPlugout(): void {
        Link.prototype.getColor = DidactedLink.getColorBackup
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
