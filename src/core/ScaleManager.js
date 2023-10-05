"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScaleManager = void 0;
const util_1 = require("./util/util");
const styleAdapter_1 = require("./styleAdapter");
const RenderManager_1 = require("./RenderManager");
const mouseDownDragManager_1 = require("./mouseDownDragManager");
class ScaleManager {
    static isScalingInProgress() {
        return this.state !== null;
    }
    static clear() {
        this.state = null;
        util_1.util.setHint(util_1.util.hintToDeactivateSnapToGrid, false);
    }
    static addScalable(scalable) {
        // TODO: set element draggable="true" or use mousedown instead of drag events
        RenderManager_1.renderManager.addClassTo(scalable.getRightBottomId(), styleAdapter_1.style.getDiagonalResizeClass());
        RenderManager_1.renderManager.addClassTo(scalable.getTopId(), styleAdapter_1.style.getVerticalResizeClass());
        RenderManager_1.renderManager.addClassTo(scalable.getBottomId(), styleAdapter_1.style.getVerticalResizeClass());
        RenderManager_1.renderManager.addClassTo(scalable.getRightId(), styleAdapter_1.style.getHorizontalResizeClass());
        RenderManager_1.renderManager.addClassTo(scalable.getLeftId(), styleAdapter_1.style.getHorizontalResizeClass());
        this.addListenersForSide(scalable, scalable.getRightBottomId(), (x, y, snapToGrid) => this.dragRightBottom(x, y, snapToGrid));
        this.addListenersForSide(scalable, scalable.getRightId(), (x, y, snapToGrid) => this.dragEastBorder(x, y, snapToGrid));
        this.addListenersForSide(scalable, scalable.getBottomId(), (x, y, snapToGrid) => this.dragSouthBorder(x, y, snapToGrid));
        this.addListenersForSide(scalable, scalable.getTopId(), (x, y, snapToGrid) => this.dragNorthBorder(x, y, snapToGrid));
        this.addListenersForSide(scalable, scalable.getLeftId(), (x, y, snapToGrid) => this.dragWestBorder(x, y, snapToGrid));
    }
    static removeScalable(scalable) {
        RenderManager_1.renderManager.removeClassFrom(scalable.getRightBottomId(), styleAdapter_1.style.getDiagonalResizeClass());
        RenderManager_1.renderManager.removeClassFrom(scalable.getTopId(), styleAdapter_1.style.getVerticalResizeClass());
        RenderManager_1.renderManager.removeClassFrom(scalable.getBottomId(), styleAdapter_1.style.getVerticalResizeClass());
        RenderManager_1.renderManager.removeClassFrom(scalable.getRightId(), styleAdapter_1.style.getHorizontalResizeClass());
        RenderManager_1.renderManager.removeClassFrom(scalable.getLeftId(), styleAdapter_1.style.getHorizontalResizeClass());
        this.removeListenersForSide(scalable.getRightBottomId());
        this.removeListenersForSide(scalable.getRightId());
        this.removeListenersForSide(scalable.getBottomId());
        this.removeListenersForSide(scalable.getTopId());
        this.removeListenersForSide(scalable.getLeftId());
    }
    static addListenersForSide(scalable, id, drag) {
        function onDragStart(eventResult) {
            return ScaleManager.dragstart(scalable, eventResult.position.x, eventResult.position.y);
        }
        async function onDrag(position, ctrlPressed) {
            await Promise.all([
                drag(position.x, position.y, !ctrlPressed),
                util_1.util.setHint(util_1.util.hintToDeactivateSnapToGrid, !ctrlPressed)
            ]);
        }
        function onDragEnd(position, ctrlPressed) {
            return ScaleManager.dragEnd();
        }
        mouseDownDragManager_1.mouseDownDragManager.addDraggable({ elementId: id, onDragStart, onDrag, onDragEnd });
    }
    static removeListenersForSide(id) {
        RenderManager_1.renderManager.removeEventListenerFrom(id, 'dragstart');
        RenderManager_1.renderManager.removeEventListenerFrom(id, 'drag');
        RenderManager_1.renderManager.removeEventListenerFrom(id, 'dragend');
    }
    static async dragstart(scalable, clientX, clientY) {
        this.state = {
            scaling: scalable,
            startParentClientRect: scalable.getParentClientRect(),
            startClientRect: scalable.getClientRect(),
            startClientX: clientX,
            startClientY: clientY
        };
        await Promise.all([
            util_1.util.setMouseEventBlockerScreenOverlay(true, RenderManager_1.RenderPriority.RESPONSIVE),
            scalable.scaleStart()
        ]);
    }
    static async dragRightBottom(clientX, clientY, snapToGrid) {
        // TODO: triggers render two times, implement with one render
        await Promise.all([
            this.dragEastBorder(clientX, clientY, snapToGrid),
            this.dragSouthBorder(clientX, clientY, snapToGrid)
        ]);
    }
    static async dragEastBorder(clientX, clientY, snapToGrid) {
        if (this.state == null) {
            util_1.util.logWarning("ScaleManager: state is null while resizing");
            return;
        }
        const startClientRect = await this.state.startClientRect;
        const startParentClientRect = await this.state.startParentClientRect;
        const newWidthInPixel = startClientRect.width + clientX - this.state.startClientX;
        let newWidthInPercent = newWidthInPixel / startParentClientRect.width * 100;
        if (snapToGrid) {
            const leftBorderPositionInPercent = (startClientRect.x - startParentClientRect.x) / startParentClientRect.width * 100;
            const newRightBorderPositionInPercent = this.state.scaling.roundToParentGridPosition(leftBorderPositionInPercent + newWidthInPercent);
            newWidthInPercent = newRightBorderPositionInPercent - leftBorderPositionInPercent;
        }
        this.state.scaling.scale({ width: newWidthInPercent });
    }
    static async dragSouthBorder(clientX, clientY, snapToGrid) {
        if (this.state == null) {
            util_1.util.logWarning("ScaleManager: state is null while resizing");
            return;
        }
        const startClientRect = await this.state.startClientRect;
        const startParentClientRect = await this.state.startParentClientRect;
        const newHeightInPixel = startClientRect.height + clientY - this.state.startClientY;
        let newHeightInPercent = newHeightInPixel / startParentClientRect.height * 100;
        if (snapToGrid) {
            const topBorderPositionInPercent = (startClientRect.y - startParentClientRect.y) / startParentClientRect.height * 100;
            const newBottomBorderPositionInPercent = this.state.scaling.roundToParentGridPosition(topBorderPositionInPercent + newHeightInPercent);
            newHeightInPercent = newBottomBorderPositionInPercent - topBorderPositionInPercent;
        }
        this.state.scaling.scale({ height: newHeightInPercent });
    }
    static async dragNorthBorder(clientX, clientY, snapToGrid) {
        if (this.state == null) {
            util_1.util.logWarning("ScaleManager: state is null while resizing");
            return;
        }
        const startClientRect = await this.state.startClientRect;
        const startParentClientRect = await this.state.startParentClientRect;
        const dragDistanceInPixel = clientY - this.state.startClientY;
        const newYInPixel = startClientRect.y - startParentClientRect.y + dragDistanceInPixel;
        const newHeightInPixel = startClientRect.height - dragDistanceInPixel;
        let newYInPercent = newYInPixel / startParentClientRect.height * 100;
        let newHeightInPercent = newHeightInPixel / startParentClientRect.height * 100;
        if (snapToGrid) {
            const snapToGridDelta = this.state.scaling.roundToParentGridPosition(newYInPercent) - newYInPercent;
            newYInPercent += snapToGridDelta;
            newHeightInPercent -= snapToGridDelta;
        }
        this.state.scaling.scale({ y: newYInPercent, height: newHeightInPercent });
    }
    static async dragWestBorder(clientX, clientY, snapToGrid) {
        if (this.state == null) {
            util_1.util.logWarning("ScaleManager: state is null while resizing");
            return;
        }
        const startClientRect = await this.state.startClientRect;
        const startParentClientRect = await this.state.startParentClientRect;
        const dragDistanceInPixel = clientX - this.state.startClientX;
        const newXInPixel = startClientRect.x - startParentClientRect.x + dragDistanceInPixel;
        const newWidthInPixel = startClientRect.width - dragDistanceInPixel;
        let newXInPercent = newXInPixel / startParentClientRect.width * 100;
        let newWidthInPercent = newWidthInPixel / startParentClientRect.width * 100;
        if (snapToGrid) {
            const snapToGridDelta = this.state.scaling.roundToParentGridPosition(newXInPercent) - newXInPercent;
            newXInPercent += snapToGridDelta;
            newWidthInPercent -= snapToGridDelta;
        }
        this.state.scaling.scale({ x: newXInPercent, width: newWidthInPercent });
    }
    static async dragEnd() {
        const pros = [];
        pros.push(util_1.util.setMouseEventBlockerScreenOverlay(false, RenderManager_1.RenderPriority.RESPONSIVE));
        if (this.state == null) {
            util_1.util.logWarning("ScaleManager: failed to save resize operation, state is null although resizing was in progress");
            return;
        }
        pros.push(this.state.scaling.scaleEnd());
        pros.push(util_1.util.setHint(util_1.util.hintToDeactivateSnapToGrid, false));
        this.state = null;
        await Promise.all(pros);
    }
}
exports.ScaleManager = ScaleManager;
ScaleManager.state = null;
