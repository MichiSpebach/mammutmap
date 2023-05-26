import { renderManager, RenderPriority } from '../RenderManager'
import { NodeData } from '../mapData/NodeData'
import { Draggable } from '../Draggable'
import { Box } from '../box/Box'
import { DropTarget } from '../DropTarget'
import { ClientPosition } from '../shape/ClientPosition'
import { LocalPosition } from '../shape/LocalPosition'
import { util } from '../util/util'
import { relocationDragManager } from '../RelocationDragManager'
import { BoxNodesWidget } from '../box/BoxNodesWidget'
import { BorderingLinks } from '../link/BorderingLinks'
import { ClientRect } from '../ClientRect'
import * as contextMenu from '../contextMenu'
import { AbstractNodeWidget } from '../AbstractNodeWidget'
import { Link } from '../link/Link'
import { Style } from '../util/RenderElement'

export class NodeWidget extends AbstractNodeWidget implements DropTarget, Draggable<Box> { // TODO: rename to LinkNodeWidget
    private readonly mapData: NodeData
    private managingBox: Box // TODO: rename to parent?
    public readonly borderingLinks: BorderingLinks
    private rendered: boolean = false // TODO: use RenderState
    private renderInProgress: boolean = false
    private unrenderInProgress: boolean = false
    private dragState: {
        positionInManagingBoxCoords: LocalPosition
    } | null = null

    public constructor(mapData: NodeData, managingBox: Box) {
        super()
        this.mapData = mapData
        this.managingBox = managingBox
        this.borderingLinks = new BorderingLinks(this)
    }

    public getId(): string {
        return this.mapData.id
    }

    public getName(): string {
        return this.mapData.id // TODO: add name field to NodeData
    }

    public getSrcPath(): string {
        return util.concatPaths(this.getParent().getSrcPath(), this.getName())
    }

    public getMapData(): NodeData {
        return this.mapData
    }

    public getParentBorderingLinks(): BorderingLinks {
        return this.managingBox.borderingLinks
    }

    public getParent(): Box {
        return this.managingBox
    }

    /**@deprecated use getParent() instead*/
    public getManagingBox(): Box {
        return this.managingBox
    }

    public isBeingRendered(): boolean {
        if (this.renderInProgress) {
            return true
        } else if (this.unrenderInProgress) {
            return false
        } else {
            return this.rendered
        }
    }

    public async getClientShape(): Promise<ClientRect> {
        const clientPosition: ClientPosition = await this.managingBox.transform.localToClientPosition(this.getRenderPosition())
        return new ClientRect(clientPosition.x-7, clientPosition.y-7, 14, 14)
    }

    public getRenderPosition(): LocalPosition {
        return this.dragState ? this.dragState.positionInManagingBoxCoords : this.mapData.getPosition()
    }

    public getSavePosition(): LocalPosition {
        return this.mapData.getPosition()
    }

    public isMapDataFileExisting(): boolean {
        return this.getManagingBox().isMapDataFileExisting()
    }

    public saveMapData(): Promise<void> {
        return this.getManagingBox().saveMapData()
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

        const position: LocalPosition = this.getRenderPosition()
        const style: Style = {
            position: 'absolute',
            top: position.percentY+'%',
            left: position.percentX+'%',
            width: '14px',
            height: '14px',
            transform: 'translate(-7px,-7px)',
            borderRadius: '30%',
            backgroundColor: '#0aa8'
        }
        proms.push(renderManager.setStyleTo(this.getId(), style, priority))

        if (!this.rendered) {
            proms.push(this.borderingLinks.renderAll())
            proms.push(relocationDragManager.addDropTarget(this))
            proms.push(relocationDragManager.addDraggable(this, priority))
            proms.push(renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForNode(this, new ClientPosition(clientX, clientY))))
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
        proms.push(this.borderingLinks.renderAll()) // otherwise borderingLinks would not float back to border of parent
        proms.push(relocationDragManager.removeDropTarget(this))
        proms.push(relocationDragManager.removeDraggable(this, priority))
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

        if (this.getParent() === dropTarget) {
            this.mapData.setPosition(this.dragState.positionInManagingBoxCoords)
            await Promise.all([
                this.getParent().saveMapData(),
                this.setDragStateAndRender(null, RenderPriority.RESPONSIVE)
            ])
        } else {
            const clientPosition: ClientPosition = await this.managingBox.transform.localToClientPosition(this.dragState.positionInManagingBoxCoords)
            const positionInDropTargetCoords: LocalPosition = await dropTarget.transform.clientToLocalPosition(clientPosition)
            this.mapData.setPosition(positionInDropTargetCoords)
            const borderingLinksToReorder: Link[] = this.borderingLinks.getAll()
            const oldManagingBox: Box = this.managingBox
            this.managingBox = dropTarget
            await BoxNodesWidget.changeManagingBoxOfNodeAndSave(oldManagingBox, dropTarget, this)
            await this.setDragStateAndRender(null, RenderPriority.RESPONSIVE)
            await Promise.all(borderingLinksToReorder.map(link => link.reorderAndSaveAndRender({movedWayPoint: this})))
        }
    }

}
