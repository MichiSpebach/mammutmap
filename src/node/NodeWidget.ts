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

export class NodeWidget extends Widget implements Draggable<Box> {
    private readonly mapData: NodeData
    private managingBox: Box
    private rendered: boolean = false
    private dragState: {
        positionInManagingBoxCoords: LocalPosition
    } | null = null

    public constructor(mapData: NodeData, managingBox: Box) {
        super()
        this.mapData = mapData
        this.managingBox = managingBox
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

    private async setDragStateAndRender(
        dragState: {positionInManagingBoxCoords: LocalPosition} | null,
        priority: RenderPriority
    ): Promise<void> {
        this.dragState = dragState
        await this.render(priority)
    }

    public async render(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        const proms: Promise<any>[] = []

        const position: LocalPosition = this.dragState ? this.dragState.positionInManagingBoxCoords : this.mapData.getPosition()
        const positionStyle = `position:absolute;top:${position.percentY}%;left:${position.percentX}%;`
        const sizeStyle = 'width:10px;height:10px;transform:translate(-5px,-5px);'
        const borderStyle = 'border-style:solid;border-width:1px;border-radius:50%;'
        const colorStyle = 'border-color:grey;background-color:#0ff8;'
        proms.push(renderManager.setStyleTo(this.getId(), positionStyle+sizeStyle+borderStyle+colorStyle, priority))

        if (!this.rendered) {
            proms.push(DragManager.addDraggable(this, priority))
            this.rendered = true
        }

        await Promise.all(proms)
    }

    public async unrender(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        if (!this.rendered) {
            return
        }
        await DragManager.removeDraggable(this, priority)
        this.rendered = false // TODO: implement rerenderAfter(Un)RenderFinished mechanism?
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
    }

    public async dragCancel(): Promise<void> {
        await this.setDragStateAndRender(null, RenderPriority.RESPONSIVE)
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
            proms.push(BoxNodesWidget.changeManagingBoxOfNodeAndSave(oldManagingBox, dropTarget, this))
        }

        proms.push(this.setDragStateAndRender(null, RenderPriority.RESPONSIVE))

        await Promise.all(proms)
    }

}