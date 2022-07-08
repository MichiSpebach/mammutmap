import { renderManager, RenderPriority } from '../RenderManager'
import { NodeData } from '../mapData/NodeData'
import { Widget } from '../Widget'
import { Draggable } from '../Draggable'
import { Box } from '../box/Box'
import { DropTarget } from '../DropTarget'
import { ClientPosition } from '../box/Transform'
import { LocalPosition } from '../box/Transform'
import { util } from '../util'
import { DragManager } from '../DragManager'
import { BoxNodesWidget } from '../box/BoxNodesWidget'
import { BorderingLinks } from '../link/BorderingLinks'
import { ClientCircle } from '../shape/ClientCircle'
import * as contextMenu from '../contextMenu'

export class NodeWidget extends Widget implements DropTarget, Draggable<Box> {
    private readonly mapData: NodeData
    private managingBox: Box
    public readonly borderingLinks: BorderingLinks
    private rendered: boolean = false
    private renderInProgress: boolean = false
    private unrenderInProgress: boolean = false
    private dragState: {
        positionInManagingBoxCoords: LocalPosition
    } | null = null

    public constructor(mapData: NodeData, managingBox: Box) {
        super()
        this.mapData = mapData
        this.managingBox = managingBox
        this.borderingLinks = new BorderingLinks(managingBox)
    }

    public getId(): string {
        return this.mapData.id
    }

    public getMapData(): NodeData {
        return this.mapData
    }

    public getManagingBox(): Box {
        return this.managingBox
    }

    public shouldBeRendered(): boolean {
        if (this.renderInProgress) {
            return true
        } else if (this.unrenderInProgress) {
            return false
        } else {
            return this.rendered
        }
    }

    public async getClientShape(): Promise<ClientCircle> {
        const clientPosition: ClientPosition = await this.managingBox.transform.localToClientPosition(this.getPosition())
        return new ClientCircle(clientPosition.x, clientPosition.y, 5)
    }

    private getPosition(): LocalPosition {
        return this.dragState ? this.dragState.positionInManagingBoxCoords : this.mapData.getPosition()
    }

    private async setDragStateAndRender(
        dragState: {positionInManagingBoxCoords: LocalPosition} | null,
        priority: RenderPriority
    ): Promise<void> {
        this.dragState = dragState
        await this.render(priority)
    }

    public async render(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        this.renderInProgress = true
        const proms: Promise<any>[] = []

        const position: LocalPosition = this.getPosition()
        const positionStyle = `position:absolute;top:${position.percentY}%;left:${position.percentX}%;`
        const sizeStyle = 'width:10px;height:10px;transform:translate(-5px,-5px);'
        const borderStyle = 'border-style:solid;border-width:1px;border-radius:50%;'
        const colorStyle = 'border-color:grey;background-color:#0ff8;'
        proms.push(renderManager.setStyleTo(this.getId(), positionStyle+sizeStyle+borderStyle+colorStyle, priority))

        if (!this.rendered) {
            proms.push(this.getManagingBox().borderingLinks.renderLinksThatIncludeWayPointFor(this.getId()))
            DragManager.addDropTarget(this)
            proms.push(DragManager.addDraggable(this, priority))
            proms.push(renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForNode(this, clientX, clientY)))
        }
        
        await Promise.all(proms)
        this.rendered = true
        this.renderInProgress = false
    }

    public async unrender(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        if (!this.rendered) {
            return
        }
        this.unrenderInProgress = true
        const proms: Promise<any>[] = []
        proms.push(this.getManagingBox().borderingLinks.renderLinksThatIncludeWayPointFor(this.getId()))
        DragManager.removeDropTarget(this)
        proms.push(DragManager.removeDraggable(this, priority))
        proms.push(renderManager.removeEventListenerFrom(this.getId(), 'contextmenu'))
        await Promise.all(proms)
        this.rendered = false // TODO: implement rerenderAfter(Un)RenderFinished mechanism?
        this.unrenderInProgress = false
    }

    public async onDragEnter(): Promise<void> {
        return Promise.resolve() // TODO: highlight
    }

    public async onDragLeave(): Promise<void> {
        return Promise.resolve() // TODO: stop highlight
    }

    public getDropTargetAtDragStart(): Box {
        return this.getManagingBox()
    }

    public canBeDroppedInto(dropTarget: DropTarget): boolean {
        return dropTarget instanceof Box
    }

    public async dragStart(clientX: number, clientY: number): Promise<void> {
        await Promise.resolve() // TODO: store offset in dragState, or handle offset in DragManager
    }

    public async drag(clientX: number, clientY: number, dropTarget: Box, snapToGrid: boolean): Promise<void> {
        const clientPosition = new ClientPosition(clientX, clientY)

        let positionInManagingBoxCoords: LocalPosition
        if (snapToGrid) {
            positionInManagingBoxCoords = await this.getManagingBox().transform.getNearestGridPositionOfOtherTransform(clientPosition, dropTarget.transform)
        } else {
            positionInManagingBoxCoords = await this.getManagingBox().transform.clientToLocalPosition(clientPosition)
        }

        await this.setDragStateAndRender({positionInManagingBoxCoords}, RenderPriority.RESPONSIVE)
        await this.borderingLinks.renderAll()
    }

    public async dragCancel(): Promise<void> {
        await this.setDragStateAndRender(null, RenderPriority.RESPONSIVE)
        await this.borderingLinks.renderAll()
    }

    public async dragEnd(dropTarget: Box): Promise<void> {
        if (!this.dragState) {
            util.logWarning('NodeWidget.dragEnd(..) called although dragState is null => drag operation cannot be saved and is canceled, this should never happed')
            return this.dragCancel()
        }

        const proms: Promise<any>[] = []

        if (this.getManagingBox() === dropTarget) {
            this.mapData.setPosition(this.dragState.positionInManagingBoxCoords)
            proms.push(this.getManagingBox().saveMapData())
        } else {
            const clientPosition: ClientPosition = await this.managingBox.transform.localToClientPosition(this.dragState.positionInManagingBoxCoords)
            const positionInDropTargetCoords: LocalPosition = await dropTarget.transform.clientToLocalPosition(clientPosition)
            this.mapData.setPosition(positionInDropTargetCoords)
            const oldManagingBox: Box = this.managingBox
            this.managingBox = dropTarget
            await BoxNodesWidget.changeManagingBoxOfNodeAndSave(oldManagingBox, dropTarget, this)
            proms.push(this.borderingLinks.reorderAndSaveAll())
        }

        proms.push(this.setDragStateAndRender(null, RenderPriority.RESPONSIVE))

        await Promise.all(proms)
    }

}
