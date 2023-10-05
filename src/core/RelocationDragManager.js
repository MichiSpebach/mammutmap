"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RelocationDragManager = exports.relocationDragManager = void 0;
const util_1 = require("./util/util");
const RenderManager_1 = require("./RenderManager");
const BoxWatcher_1 = require("./box/BoxWatcher");
const mouseDownDragManager_1 = require("./mouseDownDragManager");
class RelocationDragManager {
    constructor() {
        this.draggableStyleClass = 'draggable';
        this.draggingInProgressStyleClass = 'draggingInProgress';
        this.dragManager = mouseDownDragManager_1.mouseDownDragManager;
        this.dropTargets = new Map();
        this.state = null;
    }
    isUsingNativeDragEvents() {
        return this.dragManager.isUsingNativeDragEvents();
    }
    isDraggingInProgress() {
        return this.state !== null;
    }
    getState() {
        if (this.state === null) {
            util_1.util.logError("RelocationDragManager: state is null but should be set at this moment");
        }
        return this.state;
    }
    setState(newState) {
        this.handleDraggingOverStateChange(newState);
        this.handleWatcherOfManagingBoxStateChange(newState);
        this.state = newState;
    }
    handleDraggingOverStateChange(newState) {
        if (this.state?.draggingOver === newState?.draggingOver) {
            return;
        }
        if (this.state) {
            this.state.draggingOver.onDragLeave();
        }
        if (newState) {
            newState.draggingOver.onDragEnter();
        }
    }
    handleWatcherOfManagingBoxStateChange(newState) {
        if (this.state?.watcherOfManagingBoxToPreventUnrenderWhileDragging === newState?.watcherOfManagingBoxToPreventUnrenderWhileDragging) {
            return;
        }
        if (this.state) {
            this.state.watcherOfManagingBoxToPreventUnrenderWhileDragging.then(watcher => watcher.unwatch());
        }
    }
    clear() {
        this.state = null;
        util_1.util.setHint(util_1.util.hintToDeactivateSnapToGrid, false);
    }
    async addDraggable(elementToDrag, priority = RenderManager_1.RenderPriority.NORMAL) {
        const draggableId = elementToDrag.getId();
        await Promise.all([
            RenderManager_1.renderManager.addClassTo(draggableId, this.draggableStyleClass, priority),
            this.dragManager.addDraggable({
                elementId: elementToDrag.getId(),
                movementNeededToStartDrag: true,
                onDragStart: async (eventResult) => this.onDragStart(elementToDrag, eventResult.position.x, eventResult.position.y, !eventResult.ctrlPressed, false),
                onDrag: async (position, ctrlPressed) => this.onDrag(position.x, position.y, !ctrlPressed),
                onDragEnd: async (position, ctrlPressed) => this.onDragEnd()
            })
        ]);
        // TODO: call elementToDrag.dragCancel() if esc is pressed (and remove draggingInProgressStyleClass)
    }
    async removeDraggable(elementToDrag, priority = RenderManager_1.RenderPriority.NORMAL) {
        const draggableId = elementToDrag.getId();
        await Promise.all([
            RenderManager_1.renderManager.removeClassFrom(draggableId, this.draggableStyleClass, priority),
            this.dragManager.removeDraggable(draggableId)
        ]);
    }
    async onDragStart(elementToDrag, clientX, clientY, snapToGrid, clickToDropMode) {
        if (this.state) {
            util_1.util.logWarning('Expected state to be not set onDragstart.');
        }
        this.setState({
            dragging: elementToDrag,
            draggingOver: elementToDrag.getDropTargetAtDragStart(),
            clickToDropMode: clickToDropMode,
            watcherOfManagingBoxToPreventUnrenderWhileDragging: BoxWatcher_1.BoxWatcher.newAndWatch(elementToDrag.getManagingBox())
        });
        await Promise.all([
            RenderManager_1.renderManager.addClassTo(elementToDrag.getId(), this.draggingInProgressStyleClass, RenderManager_1.RenderPriority.RESPONSIVE),
            elementToDrag.dragStart(clientX, clientY, this.getState().draggingOver, snapToGrid)
        ]);
    }
    onDrag(clientX, clientY, snapToGrid) {
        const state = this.getState();
        state.dragging.drag(clientX, clientY, state.draggingOver, snapToGrid);
        util_1.util.setHint(util_1.util.hintToDeactivateSnapToGrid, snapToGrid);
    }
    onDragEnd() {
        const state = this.getState();
        RenderManager_1.renderManager.removeClassFrom(state.dragging.getId(), this.draggingInProgressStyleClass, RenderManager_1.RenderPriority.RESPONSIVE);
        state.dragging.dragEnd(state.draggingOver);
        this.setState(null);
        util_1.util.setHint(util_1.util.hintToDeactivateSnapToGrid, false);
    }
    // TODO: remove and do this instead in addDropTarget (for each dropTarget)?
    /** removes forbidden cursor */
    async addDropZone(elementId) {
        await RenderManager_1.renderManager.addDragListenerTo(elementId, 'dragover', () => { });
    }
    // TODO: remove and do this instead in removeDropTarget (for each dropTarget)?
    async removeDropZone(elementId) {
        await RenderManager_1.renderManager.removeEventListenerFrom(elementId, 'dragover'); // TODO: call with specific listener
    }
    async addDropTarget(dropTarget) {
        if (this.dropTargets.has(dropTarget.getId())) {
            util_1.util.logWarning(`RelocationDragManager::addDropTarget(..) dropTarget with id '${dropTarget.getId()}' already exists.`);
        }
        const dragenterListener = () => this.onDragEnter(dropTarget);
        const mouseoverListener = () => this.onDragEnter(dropTarget);
        this.dropTargets.set(dropTarget.getId(), { dragenterListener, mouseoverListener });
        const pros = [];
        // also needed if this.isUsingNativeDragEvents() because of startDragWithClickToDropMode
        pros.push(RenderManager_1.renderManager.addEventListenerTo(dropTarget.getId(), 'mouseover', mouseoverListener));
        if (this.isUsingNativeDragEvents()) {
            pros.push(RenderManager_1.renderManager.addDragListenerTo(dropTarget.getId(), 'dragenter', dragenterListener));
        }
        await Promise.all(pros);
    }
    async removeDropTarget(dropTarget) {
        const listeners = this.dropTargets.get(dropTarget.getId());
        if (!listeners) {
            util_1.util.logWarning(`RelocationDragManager::removeDropTarget(..) dropTarget with id '${dropTarget.getId()}' not found.`);
            return;
        }
        this.dropTargets.delete(dropTarget.getId());
        const pros = [];
        pros.push(RenderManager_1.renderManager.removeEventListenerFrom(dropTarget.getId(), 'mouseover', { listenerCallback: listeners.mouseoverListener }));
        if (this.isUsingNativeDragEvents()) {
            pros.push(RenderManager_1.renderManager.removeEventListenerFrom(dropTarget.getId(), 'dragenter', { listenerCallback: listeners.dragenterListener }));
        }
        await Promise.all(pros);
    }
    onDragEnter(dropTarget) {
        if (this.state == null) {
            //util.logWarning("RelocationDragManager: state is null although dragging is in progress") // TODO: reactivate when ensured that eventType is from dragenter not mouseover
            return;
        }
        if (!this.state.dragging.canBeDroppedInto(dropTarget)) {
            return;
        }
        this.setState({
            dragging: this.state.dragging,
            draggingOver: dropTarget,
            clickToDropMode: this.state.clickToDropMode,
            watcherOfManagingBoxToPreventUnrenderWhileDragging: this.state.watcherOfManagingBoxToPreventUnrenderWhileDragging
        });
    }
    async startDragWithClickToDropMode(elementToDrag) {
        const cursorClientPosition = RenderManager_1.renderManager.getCursorClientPosition();
        await Promise.all([
            this.onDragStart(elementToDrag, cursorClientPosition.x, cursorClientPosition.y, false /*TODO?: check if ctrl is pressed*/, true),
            RenderManager_1.renderManager.addEventListenerTo('content', 'mousemove', (clientX, clientY, ctrlPressed) => {
                this.onDrag(clientX, clientY, !ctrlPressed);
            }, RenderManager_1.RenderPriority.RESPONSIVE),
            RenderManager_1.renderManager.addEventListenerTo('content', 'click', (_) => {
                RenderManager_1.renderManager.removeEventListenerFrom('content', 'mousemove', { priority: RenderManager_1.RenderPriority.RESPONSIVE });
                RenderManager_1.renderManager.removeEventListenerFrom('content', 'click', { priority: RenderManager_1.RenderPriority.RESPONSIVE });
                this.onDragEnd();
            }, RenderManager_1.RenderPriority.RESPONSIVE)
        ]);
    }
}
exports.RelocationDragManager = RelocationDragManager;
exports.relocationDragManager = new RelocationDragManager();
