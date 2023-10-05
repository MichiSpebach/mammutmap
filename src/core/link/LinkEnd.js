"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkEnd = void 0;
const util_1 = require("../util/util");
const RenderManager_1 = require("../RenderManager");
const RelocationDragManager_1 = require("../RelocationDragManager");
const Box_1 = require("../box/Box");
const ClientPosition_1 = require("../shape/ClientPosition");
const WayPointData_1 = require("../mapData/WayPointData");
const NodeWidget_1 = require("../node/NodeWidget");
const FolderBox_1 = require("../box/FolderBox");
const linkUtil = require("./linkUtil");
const RenderState_1 = require("../util/RenderState");
const SkipToNewestScheduler_1 = require("../util/SkipToNewestScheduler");
class LinkEnd {
    constructor(id, data, referenceLink, shape) {
        this.renderState = new RenderState_1.RenderState();
        this.renderScheduler = new SkipToNewestScheduler_1.SkipToNewestScheduler();
        this.dragState = null;
        this.id = id;
        this.data = data;
        this.referenceLink = referenceLink;
        this.shape = shape;
    }
    getId() {
        return this.id;
    }
    getReferenceLink() {
        return this.referenceLink;
    }
    getManagingBox() {
        return this.referenceLink.getManagingBox();
    }
    isBoxInPath(box) {
        return this.data.path.some(wayPoint => wayPoint.boxId === box.getId());
    }
    getDropTargetAtDragStart() {
        return this.getDeepestRenderedWayPoint().linkable;
    }
    canBeDroppedInto(dropTarget) {
        return dropTarget instanceof Box_1.Box || dropTarget instanceof NodeWidget_1.NodeWidget;
    }
    // TODO: only workaround, remove asap
    getDropTargetIfRenderInProgress() {
        return this.dragState && this.dragState.dropTarget;
    }
    async dragStart(clientX, clientY, dropTarget, snapToGrid) {
        this.dragState = { clientPosition: new ClientPosition_1.ClientPosition(clientX, clientY), dropTarget, snapToGrid };
        return this.referenceLink.renderWithOptions({ priority: RenderManager_1.RenderPriority.RESPONSIVE, draggingInProgress: true });
    }
    async drag(clientX, clientY, dropTarget, snapToGrid) {
        this.dragState = { clientPosition: new ClientPosition_1.ClientPosition(clientX, clientY), dropTarget: dropTarget, snapToGrid: snapToGrid };
        return this.referenceLink.render(RenderManager_1.RenderPriority.RESPONSIVE);
    }
    async dragCancel() {
        await this.referenceLink.renderWithOptions({ priority: RenderManager_1.RenderPriority.RESPONSIVE, draggingInProgress: false });
        this.dragState = null;
    }
    async dragEnd(dropTarget) {
        if (!this.dragState) {
            util_1.util.logWarning('dragState is null while calling dragEnd(..) on LinkEnd, this should never happen');
        }
        else {
            this.dragState.dropTarget = dropTarget;
        }
        await this.referenceLink.reorderAndSaveAndRender({ movedWayPoint: dropTarget, movedLinkEnd: this, priority: RenderManager_1.RenderPriority.RESPONSIVE, draggingInProgress: false });
        this.dragState = null;
    }
    async reorderMapDataPathWithoutRender(options) {
        if (options.newManagingBoxForValidation !== this.getManagingBox()) {
            let message = 'newManagingBox should already be set to referenceLink when calling reorderMapDataPathWithoutRender(..)';
            message += ', this will likely lead to further problems';
            util_1.util.logWarning(message);
        }
        const target = options.movedWayPoint;
        let targetWayPoint;
        if (this.dragState) {
            if (target instanceof NodeWidget_1.NodeWidget) {
                targetWayPoint = WayPointData_1.WayPointData.buildNew(target.getId(), 'node' + target.getId(), 50, 50);
            }
            else {
                const position = await target.transform.clientToLocalPosition(await this.getTargetPositionInClientCoords());
                targetWayPoint = WayPointData_1.WayPointData.buildNew(target.getId(), target.getName(), position.percentX, position.percentY);
            }
        }
        else {
            targetWayPoint = this.getWayPointOf(target);
        }
        const shallowRenderedPath = [];
        if (target instanceof NodeWidget_1.NodeWidget) {
            const targetBox = target.getParent();
            shallowRenderedPath.unshift({ box: targetBox, wayPoint: targetWayPoint });
            if (targetBox !== this.getManagingBox()) {
                const positionInTargetBoxCoords = target.getSavePosition();
                const targetBoxWayPoint = WayPointData_1.WayPointData.buildNew(targetBox.getId(), targetBox.getName(), positionInTargetBoxCoords.percentX, positionInTargetBoxCoords.percentY);
                shallowRenderedPath.unshift({ box: targetBox, wayPoint: targetBoxWayPoint });
            }
        }
        else {
            shallowRenderedPath.unshift({ box: target, wayPoint: targetWayPoint });
        }
        for (let previous = shallowRenderedPath[0]; previous.box !== this.getManagingBox(); previous = shallowRenderedPath[0]) {
            if (previous.box.isRoot()) {
                let message = `did not find managingBox while reorderMapDataPathWithoutRender(..) of LinkEnd with id ${this.getId()}`;
                message += ', this could happen when reorderMapDataPathWithoutRender(..) is called before the new managingBox is set';
                util_1.util.logWarning(message);
                break;
            }
            const nextBox = previous.box.getParent();
            if (nextBox === this.getManagingBox()) {
                break;
            }
            const nextPosition = previous.box.transform.toParentPosition(previous.wayPoint.getPosition());
            const nextWayPoint = WayPointData_1.WayPointData.buildNew(nextBox.getId(), nextBox.getName(), nextPosition.percentX, nextPosition.percentY);
            shallowRenderedPath.unshift({ box: nextBox, wayPoint: nextWayPoint });
        }
        let newPath;
        if (this.dragState) {
            newPath = shallowRenderedPath.map(tuple => tuple.wayPoint);
        }
        else {
            newPath = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(this.data.path, shallowRenderedPath.map(tuple => tuple.wayPoint));
        }
        this.data.path = newPath;
        await this.saveBorderingBoxesWithoutMapFile();
    }
    getWayPointOf(box) {
        for (const wayPoint of this.data.path) {
            if (wayPoint.boxId === box.getId()) {
                return wayPoint;
            }
        }
        util_1.util.logWarning('wayPoint not found, this should never happen');
        return WayPointData_1.WayPointData.buildNew(box.getId(), 'workaround', 50, 50);
    }
    async saveBorderingBoxesWithoutMapFile() {
        const borderingBoxesWithoutMapFile = this.getRenderedPathWithoutManagingBox().filter(box => !box.isMapDataFileExisting());
        await Promise.all(borderingBoxesWithoutMapFile.map(box => box.saveMapData()));
    }
    // TODO: remove parameter positionInManagingBoxCoords
    // TODO: now more frequent called, add renderPriority
    async render(positionInManagingBoxCoords, angleInRadians) {
        await this.renderScheduler.schedule(async () => {
            this.renderState.setRenderStarted();
            const pros = [];
            pros.push(this.renderShape(positionInManagingBoxCoords, angleInRadians));
            pros.push(this.setHighlight());
            if (!this.renderState.isRendered()) {
                this.saveBorderingBoxesWithoutMapFile(); // TODO: add missing await? but could take longer and block rerenders
                pros.push(RelocationDragManager_1.relocationDragManager.addDraggable(this));
            }
            await Promise.all(pros);
            this.renderState.setRenderFinished();
        });
    }
    async unrender() {
        await this.renderScheduler.schedule(async () => {
            if (!this.renderState.isRendered()) {
                return;
            }
            this.renderState.setUnrenderStarted();
            await Promise.all([
                RelocationDragManager_1.relocationDragManager.removeDraggable(this),
                RenderManager_1.renderManager.setStyleTo(this.getId(), '')
            ]);
            this.renderState.setUnrenderFinished();
        });
    }
    async renderShape(positionInManagingBoxCoords, angleInRadians) {
        const positionStyle = 'position:absolute;left:' + positionInManagingBoxCoords.percentX + '%;top:' + positionInManagingBoxCoords.percentY + '%;';
        let shapeStyle;
        let transformStyle;
        switch (this.shape) {
            case 'square':
                shapeStyle = 'width:10px;height:10px;background-color:' + this.referenceLink.getColor() + ';';
                transformStyle = 'transform:translate(-5px,-5px);';
                break;
            case 'arrow':
                shapeStyle = 'width:28px;height:10px;background-color:' + this.referenceLink.getColor() + ';clip-path:polygon(0% 0%, 55% 50%, 0% 100%);';
                transformStyle = 'transform:translate(-14px,-5px)rotate(' + angleInRadians + 'rad);';
                break;
            default:
                shapeStyle = '';
                transformStyle = '';
                util_1.util.logWarning('Shape ' + this.shape + ' is not implemented.');
        }
        await RenderManager_1.renderManager.setStyleTo(this.getId(), positionStyle + shapeStyle + transformStyle);
    }
    async setHighlight() {
        const highlightClass = this.referenceLink.getHighlightClass();
        if (this.referenceLink.isHighlight()) {
            await RenderManager_1.renderManager.addClassTo(this.getId(), highlightClass);
        }
        else {
            await RenderManager_1.renderManager.removeClassFrom(this.getId(), highlightClass);
        }
    }
    async getRenderPositionInManagingBoxCoords() {
        //if (this.data.floatToBorder) { // TODO: activate or rename to renderInsideBox|renderInsideTargetBox
        let clientShape;
        if (this.dragState) {
            clientShape = this.dragState.dropTarget.getClientShape();
        }
        else {
            clientShape = this.getDeepestRenderedWayPoint().linkable.getClientShape(); // TODO: IMPORTANT this might be a bug when called from outside
        }
        const intersectionWithRect = await this.calculateFloatToBorderPositionRegardingClientShape(clientShape);
        if (intersectionWithRect) {
            return this.getManagingBox().transform.clientToLocalPosition(intersectionWithRect);
        }
        //}
        return this.getTargetPositionInManagingBoxCoords();
    }
    async calculateFloatToBorderPositionRegardingClientShape(shapeInClientCoords) {
        const line = await this.referenceLink.getLineInClientCoords();
        const intersectionsWithShape = (await shapeInClientCoords).calculateIntersectionsWithLine(line);
        if (intersectionsWithShape.length < 1) {
            return undefined;
        }
        let nearestIntersection = intersectionsWithShape[0];
        for (let i = 1; i < intersectionsWithShape.length; i++) {
            let targetPositionOfOtherLinkEnd;
            if (this === this.referenceLink.from) {
                targetPositionOfOtherLinkEnd = line.to;
            }
            else {
                targetPositionOfOtherLinkEnd = line.from;
            }
            if (targetPositionOfOtherLinkEnd.calculateDistanceTo(intersectionsWithShape[i]) < targetPositionOfOtherLinkEnd.calculateDistanceTo(nearestIntersection)) {
                nearestIntersection = intersectionsWithShape[i];
            }
        }
        return nearestIntersection;
    }
    async getTargetPositionInManagingBoxCoords() {
        if (this.dragState) {
            if (this.dragState.snapToGrid && this.dragState.dropTarget instanceof Box_1.Box) {
                return this.getManagingBox().transform.getNearestGridPositionOfOtherTransform(this.dragState.clientPosition, this.dragState.dropTarget.transform);
            }
            else {
                return this.getManagingBox().transform.clientToLocalPosition(this.dragState.clientPosition);
            }
        }
        else {
            return this.getDeepestRenderedWayPointPositionInManagingBoxCoords();
        }
    }
    async getTargetPositionInClientCoords() {
        if (this.dragState) {
            if (this.dragState.snapToGrid && this.dragState.dropTarget instanceof Box_1.Box) {
                return this.dragState.dropTarget.transform.getNearestGridPositionInClientCoords(this.dragState.clientPosition);
            }
            else {
                return this.dragState.clientPosition; // TODO: should snap to center of NodeWidget
            }
        }
        else {
            return this.getManagingBox().transform.localToClientPosition(this.getDeepestRenderedWayPointPositionInManagingBoxCoords());
        }
    }
    getDeepestRenderedWayPointPositionInManagingBoxCoords() {
        const deepestRendered = this.getDeepestRenderedWayPoint();
        let deepestRenderedBox;
        let positionInDeepestRenderedBoxCoords;
        if (deepestRendered.linkable instanceof NodeWidget_1.NodeWidget) {
            deepestRenderedBox = deepestRendered.linkable.getManagingBox();
            positionInDeepestRenderedBoxCoords = deepestRendered.linkable.getRenderPosition();
        }
        else {
            deepestRenderedBox = deepestRendered.linkable;
            positionInDeepestRenderedBoxCoords = deepestRendered.wayPoint.getPosition();
        }
        return this.getManagingBox().transform.innerCoordsRecursiveToLocal(deepestRenderedBox, positionInDeepestRenderedBoxCoords);
    }
    getDeepestRenderedWayPoint() {
        const renderedBoxes = this.getRenderedPath();
        return renderedBoxes[renderedBoxes.length - 1];
    }
    getRenderedPathWithoutManagingBox() {
        return this.getRenderedPath()
            .map((tuple) => tuple.linkable)
            .filter(linkable => linkable !== this.getManagingBox());
    }
    // TODO: rewrite, fragility comes from breaking the encapsulation of Box. simply call this.getManagingBox().getRenderedBoxesInPath(path: Path): Box[] and merge it with wayPointData
    getRenderedPath() {
        if (this.data.path.length === 0) {
            let message = 'Corrupted mapData detected: ';
            message += `Link with id ${this.referenceLink.getId()} in ${this.getManagingBox().getSrcPath()} has empty path.`;
            util_1.util.logWarning(message);
        }
        const renderedPath = [];
        let parentBox = this.getManagingBox();
        for (let i = 0; i < this.data.path.length; i++) {
            const wayPoint = this.data.path[i];
            let linkable;
            if (parentBox.getId() === wayPoint.boxId) {
                linkable = parentBox;
            }
            else if (parentBox instanceof FolderBox_1.FolderBox) {
                linkable = parentBox.getBox(wayPoint.boxId);
            }
            if (!linkable) {
                linkable = parentBox.nodes.getNodeById(wayPoint.boxId);
            }
            if (!linkable || !linkable.isBeingRendered()) {
                break;
            }
            renderedPath.push({ linkable, wayPoint });
            if (linkable instanceof Box_1.Box) {
                parentBox = linkable;
            }
            else {
                break;
            }
        }
        if (renderedPath.length === 0) {
            const managingBox = this.getManagingBox();
            let message = `Link with id ${this.referenceLink.getId()} in ${managingBox.getSrcPath()} has path with no rendered boxes.`;
            if (managingBox.isBodyBeingRendered()) {
                message += ' This only happens when mapData is corrupted or LinkEnd::getRenderedPath() is called when it shouldn\'t.';
            }
            else {
                message += ' Reason is most likely that the managingBox of the link is (being) unrendered.';
            }
            message += ' Defaulting LinkEnd to center of managingBox.';
            util_1.util.logWarning(message);
            renderedPath.push({ linkable: managingBox, wayPoint: WayPointData_1.WayPointData.buildNew(managingBox.getId(), managingBox.getName(), 50, 50) });
        }
        return renderedPath;
    }
}
exports.LinkEnd = LinkEnd;
