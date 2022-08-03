import { Link } from '../dist/box/Link'
import { WayPointData } from '../dist/box/WayPointData'
import { NodeWidget } from '../dist/node/NodeWidget'
import { Box } from '../dist/pluginFacade'
import * as applicationMenu from '../dist/applicationMenu'
import { MenuItem } from 'electron'
import { util } from '../dist/util'

const deactivateToggleMenuItem: MenuItem = new MenuItem({label: 'deactivate', click: deactivate})
const activateMenuItem: MenuItem = new MenuItem({label: 'activate', click: activate})
applicationMenu.addMenuItemTo('linkDidactor.js', deactivateToggleMenuItem)
applicationMenu.addMenuItemTo('linkDidactor.js', activateMenuItem)

function deactivate(): void {
    DidactedLink.deactivateAndPlugout()
    deactivateToggleMenuItem.enabled = false
    activateMenuItem.enabled = true
    util.logInfo('deactivated linkDidactor plugin')
}

function activate(): void {
    DidactedLink.activateAndPlugin()
    deactivateToggleMenuItem.enabled = true
    activateMenuItem.enabled = false
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
