"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeWidget = void 0;
const RenderManager_1 = require("../RenderManager");
const Box_1 = require("../box/Box");
const ClientPosition_1 = require("../shape/ClientPosition");
const util_1 = require("../util/util");
const RelocationDragManager_1 = require("../RelocationDragManager");
const BoxNodesWidget_1 = require("../box/BoxNodesWidget");
const BorderingLinks_1 = require("../link/BorderingLinks");
const ClientRect_1 = require("../ClientRect");
const contextMenu = require("../contextMenu");
const AbstractNodeWidget_1 = require("../AbstractNodeWidget");
const HoverManager_1 = require("../HoverManager");
class NodeWidget extends AbstractNodeWidget_1.AbstractNodeWidget {
    constructor(mapData, managingBox) {
        super();
        this.rendered = false; // TODO: use RenderState
        this.renderInProgress = false;
        this.unrenderInProgress = false;
        this.dragState = null;
        this.highlight = false;
        this.mapData = mapData;
        this.managingBox = managingBox;
        this.borderingLinks = new BorderingLinks_1.BorderingLinks(this);
    }
    getId() {
        return this.mapData.id;
    }
    getName() {
        return this.mapData.id; // TODO: add name field to NodeData
    }
    getSrcPath() {
        return util_1.util.concatPaths(this.getParent().getSrcPath(), this.getName());
    }
    getMapData() {
        return this.mapData;
    }
    getParentBorderingLinks() {
        return this.managingBox.borderingLinks;
    }
    getParent() {
        return this.managingBox;
    }
    /**@deprecated use getParent() instead*/
    getManagingBox() {
        return this.managingBox;
    }
    isBeingRendered() {
        if (this.renderInProgress) {
            return true;
        }
        else if (this.unrenderInProgress) {
            return false;
        }
        else {
            return this.rendered;
        }
    }
    async getClientShape() {
        const clientPosition = await this.managingBox.transform.localToClientPosition(this.getRenderPosition());
        return new ClientRect_1.ClientRect(clientPosition.x - 7, clientPosition.y - 7, 14, 14);
    }
    getRenderPosition() {
        return this.dragState ? this.dragState.positionInManagingBoxCoords : this.mapData.getPosition();
    }
    getSavePosition() {
        return this.mapData.getPosition();
    }
    isMapDataFileExisting() {
        return this.getManagingBox().isMapDataFileExisting();
    }
    saveMapData() {
        return this.getManagingBox().saveMapData();
    }
    async setDragStateAndRender(dragState, priority) {
        this.dragState = dragState;
        await this.render(priority);
    }
    async render(priority = RenderManager_1.RenderPriority.NORMAL) {
        this.renderInProgress = true;
        const pros = [];
        const position = this.getRenderPosition();
        const radiusInPx = this.highlight ? 10 : 7;
        const style = {
            position: 'absolute',
            top: position.percentY + '%',
            left: position.percentX + '%',
            width: radiusInPx * 2 + 'px',
            height: radiusInPx * 2 + 'px',
            transform: `translate(-${radiusInPx}px,-${radiusInPx}px)`,
            borderRadius: '30%',
            backgroundColor: this.highlight ? '#8ccc' : '#0aa8'
        };
        pros.push(RenderManager_1.renderManager.setStyleTo(this.getId(), style, priority));
        if (!this.rendered) {
            pros.push(this.borderingLinks.renderAll());
            pros.push(RelocationDragManager_1.relocationDragManager.addDropTarget(this));
            pros.push(RelocationDragManager_1.relocationDragManager.addDraggable(this, priority));
            pros.push(HoverManager_1.HoverManager.addHoverable(this, () => this.onHoverOver(), () => this.onHoverOut()));
            pros.push(RenderManager_1.renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX, clientY) => contextMenu.openForNode(this, new ClientPosition_1.ClientPosition(clientX, clientY))));
        }
        await Promise.all(pros);
        this.rendered = true;
        this.renderInProgress = false;
    }
    async unrender(priority = RenderManager_1.RenderPriority.NORMAL) {
        if (!this.rendered) {
            return;
        }
        this.unrenderInProgress = true;
        const pros = [];
        pros.push(this.borderingLinks.renderAllThatShouldBe()); // otherwise borderingLinks would not float back to border of parent
        pros.push(RelocationDragManager_1.relocationDragManager.removeDropTarget(this));
        pros.push(RelocationDragManager_1.relocationDragManager.removeDraggable(this, priority));
        pros.push(HoverManager_1.HoverManager.removeHoverable(this)),
            pros.push(RenderManager_1.renderManager.removeEventListenerFrom(this.getId(), 'contextmenu'));
        await Promise.all(pros);
        this.rendered = false; // TODO: implement rerenderAfter(Un)RenderFinished mechanism?
        this.unrenderInProgress = false;
    }
    async onHoverOver() {
        this.highlight = true;
        await Promise.all([
            this.render(RenderManager_1.RenderPriority.RESPONSIVE),
            this.borderingLinks.setHighlightAllThatShouldBeRendered(true)
        ]);
    }
    async onHoverOut() {
        this.highlight = false;
        await Promise.all([
            this.render(RenderManager_1.RenderPriority.RESPONSIVE),
            this.borderingLinks.setHighlightAllThatShouldBeRendered(false)
        ]);
    }
    async onDragEnter() {
        this.highlight = true;
        await this.render(RenderManager_1.RenderPriority.RESPONSIVE);
    }
    async onDragLeave() {
        this.highlight = false;
        await this.render(RenderManager_1.RenderPriority.RESPONSIVE);
    }
    getDropTargetAtDragStart() {
        return this.getManagingBox();
    }
    canBeDroppedInto(dropTarget) {
        return dropTarget instanceof Box_1.Box;
    }
    async dragStart(clientX, clientY) {
        await Promise.resolve(); // TODO: store offset in dragState, or handle offset in DragManager
    }
    async drag(clientX, clientY, dropTarget, snapToGrid) {
        const clientPosition = new ClientPosition_1.ClientPosition(clientX, clientY);
        let positionInManagingBoxCoords;
        if (snapToGrid) {
            positionInManagingBoxCoords = await this.getManagingBox().transform.getNearestGridPositionOfOtherTransform(clientPosition, dropTarget.transform);
        }
        else {
            positionInManagingBoxCoords = await this.getManagingBox().transform.clientToLocalPosition(clientPosition);
        }
        await this.setDragStateAndRender({ positionInManagingBoxCoords }, RenderManager_1.RenderPriority.RESPONSIVE);
        await this.borderingLinks.renderAll();
    }
    async dragCancel() {
        await this.setDragStateAndRender(null, RenderManager_1.RenderPriority.RESPONSIVE);
        await this.borderingLinks.renderAll();
    }
    async dragEnd(dropTarget) {
        if (!this.dragState) {
            util_1.util.logWarning('NodeWidget.dragEnd(..) called although dragState is null => drag operation cannot be saved and is canceled, this should never happed');
            return this.dragCancel();
        }
        if (this.getParent() === dropTarget) {
            this.mapData.setPosition(this.dragState.positionInManagingBoxCoords);
            await Promise.all([
                this.getParent().saveMapData(),
                this.setDragStateAndRender(null, RenderManager_1.RenderPriority.RESPONSIVE)
            ]);
        }
        else {
            const clientPosition = await this.managingBox.transform.localToClientPosition(this.dragState.positionInManagingBoxCoords);
            const positionInDropTargetCoords = await dropTarget.transform.clientToLocalPosition(clientPosition);
            this.mapData.setPosition(positionInDropTargetCoords);
            const borderingLinksToReorder = this.borderingLinks.getAll();
            const oldManagingBox = this.managingBox;
            this.managingBox = dropTarget;
            await BoxNodesWidget_1.BoxNodesWidget.changeManagingBoxOfNodeAndSave(oldManagingBox, dropTarget, this);
            await this.setDragStateAndRender(null, RenderManager_1.RenderPriority.RESPONSIVE);
            await Promise.all(borderingLinksToReorder.map(link => link.reorderAndSaveAndRender({ movedWayPoint: this })));
        }
    }
}
exports.NodeWidget = NodeWidget;
