"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxHeaderDraggable = void 0;
const RenderManager_1 = require("../../RenderManager");
const RelocationDragManager_1 = require("../../RelocationDragManager");
const FolderBox_1 = require("../FolderBox");
const ClientPosition_1 = require("../../shape/ClientPosition");
const Settings_1 = require("../../Settings");
const util_1 = require("../../util/util");
class BoxHeaderDraggable {
    constructor(id, referenceBox) {
        this.id = id;
        this.referenceBox = referenceBox;
        this.dragOffset = { x: 0, y: 0 }; // TODO: move into DragManager and let DragManager return calculated position of box (instead of pointer)
    }
    getId() {
        return this.id;
    }
    getManagingBox() {
        return this.referenceBox.getParent();
    }
    getDropTargetAtDragStart() {
        if (this.referenceBox.isRoot()) {
            return this.referenceBox; // in order that RootFolderBox can be dragged
        }
        return this.referenceBox.getParent();
    }
    canBeDroppedInto(dropTarget) {
        return Settings_1.settings.getBoolean('boxesDraggableIntoOtherBoxes') && dropTarget instanceof FolderBox_1.FolderBox;
    }
    async dragStart(clientX, clientY, dropTarget, snapToGrid) {
        if (this.referenceBox.site.isDetached()) {
            util_1.util.logWarning(`BoxHeader::dragStart(..) called on detached box "${this.referenceBox.getName()}".`);
        }
        let clientRect = await this.referenceBox.getClientRect();
        this.dragOffset = { x: clientX - clientRect.x, y: clientY - clientRect.y };
        await RenderManager_1.renderManager.addClassTo(this.referenceBox.getId(), RelocationDragManager_1.relocationDragManager.draggingInProgressStyleClass, RenderManager_1.RenderPriority.RESPONSIVE);
    }
    async drag(clientX, clientY, dropTarget, snapToGrid) {
        if (this.referenceBox.isRoot()) {
            util_1.util.logWarning('BoxHeader::drag(..) called on rootBox, cannot drag root, also this should never happen.');
            return;
        }
        const clientPosition = new ClientPosition_1.ClientPosition(clientX - this.dragOffset.x, clientY - this.dragOffset.y);
        let positionInParentBoxCoords;
        if (!snapToGrid) {
            positionInParentBoxCoords = await this.referenceBox.getParent().transform.clientToLocalPosition(clientPosition);
        }
        else {
            positionInParentBoxCoords = await this.referenceBox.getParent().transform.getNearestGridPositionOfOtherTransform(clientPosition, dropTarget.transform);
        }
        await this.referenceBox.updateMeasuresAndBorderingLinks({ x: positionInParentBoxCoords.percentX, y: positionInParentBoxCoords.percentY }, RenderManager_1.RenderPriority.RESPONSIVE);
        await dropTarget.rearrangeBoxesWithoutMapData(this.referenceBox);
    }
    async dragCancel() {
        await Promise.all([
            RenderManager_1.renderManager.removeClassFrom(this.referenceBox.getId(), RelocationDragManager_1.relocationDragManager.draggingInProgressStyleClass, RenderManager_1.RenderPriority.RESPONSIVE),
            this.referenceBox.restoreMapData()
        ]);
    }
    async dragEnd(dropTarget) {
        const pros = [];
        pros.push(RenderManager_1.renderManager.removeClassFrom(this.referenceBox.getId(), RelocationDragManager_1.relocationDragManager.draggingInProgressStyleClass, RenderManager_1.RenderPriority.RESPONSIVE));
        if (!this.referenceBox.isRoot() && this.referenceBox.getParent() != dropTarget) {
            pros.push(this.referenceBox.setParentAndFlawlesslyResizeAndSave(dropTarget));
        }
        else {
            pros.push(this.referenceBox.saveMapData());
        }
        await Promise.all(pros);
    }
}
exports.BoxHeaderDraggable = BoxHeaderDraggable;
