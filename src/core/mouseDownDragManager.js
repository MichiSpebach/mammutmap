"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mouseDownDragManager = void 0;
const RenderManager_1 = require("./RenderManager");
const indexHtmlIds = require("./indexHtmlIds");
const util_1 = require("./util/util");
const ClientPosition_1 = require("./shape/ClientPosition");
const styleAdapter_1 = require("./styleAdapter");
class MouseDownDragManager {
    constructor() {
        this.initialized = false;
        this.dragState = null;
    }
    isUsingNativeDragEvents() {
        return false;
    }
    async addDraggable(options) {
        const pros = [];
        pros.push(RenderManager_1.renderManager.addEventListenerAdvancedTo(options.elementId, 'mousedown', { priority: options.priority, stopPropagation: true }, (eventResult) => {
            this.dragStart({ eventResult, ...options });
        }));
        if (!this.initialized) {
            pros.push(RenderManager_1.renderManager.addEventListenerTo(indexHtmlIds.htmlId, 'mouseup', (clientX, clientY, ctrlPressed) => {
                this.dragEnd(new ClientPosition_1.ClientPosition(clientX, clientY), ctrlPressed);
            }, options.priority));
            this.initialized = true;
        }
        await Promise.all(pros);
    }
    async removeDraggable(elementId, priority) {
        const pros = [
            RenderManager_1.renderManager.removeEventListenerFrom(elementId, 'mousedown', { priority }),
            //renderManager.removeEventListenerFrom(indexHtmlIds.htmlId, 'mouseup', {priority}) // TODO: remove or implement counter or do initializing in constructor and destructor
        ];
        if (this.dragState && this.dragState.elementId === elementId) {
            pros.push(this.dragEnd(this.dragState.latest.mousePosition, this.dragState.latest.ctrlPressed));
        }
        await Promise.all(pros);
    }
    dragStart(options) {
        if (this.dragState) {
            util_1.util.logWarning('MouseDownDragManager: there seem to be multiple elements that catch mousedown event at the same time or multiple mouse buttons are pressed.');
            return;
        }
        this.dragState = {
            elementId: options.elementId,
            draggingStarted: false,
            latest: { mousePosition: options.eventResult.position, ctrlPressed: options.eventResult.ctrlPressed },
            onDragEnd: options.onDragEnd
        };
        RenderManager_1.renderManager.addEventListenerTo(indexHtmlIds.htmlId, 'mousemove', async (clientX, clientY, ctrlPressed) => {
            if (!this.dragState) {
                return; // this happens when mouseup was already fired but mousemove listener is not yet removed
            }
            if (!this.dragState.draggingStarted && options.movementNeededToStartDrag) {
                this.dragState.draggingStarted = true;
                await options.onDragStart(options.eventResult);
            }
            this.drag(new ClientPosition_1.ClientPosition(clientX, clientY), ctrlPressed, options.onDrag);
        }, RenderManager_1.RenderPriority.RESPONSIVE);
        RenderManager_1.renderManager.addClassTo(indexHtmlIds.htmlId, styleAdapter_1.style.getClass('disableUserSelect'), RenderManager_1.RenderPriority.RESPONSIVE);
        if (!options.movementNeededToStartDrag) {
            this.dragState.draggingStarted = true;
            options.onDragStart(options.eventResult);
        }
    }
    drag(position, ctrlPressed, onDrag) {
        if (!this.dragState) {
            return; // this happens when mouseup was already fired but mousemove listener is not yet removed
        }
        this.dragState.latest = { mousePosition: position, ctrlPressed };
        onDrag(position, ctrlPressed);
    }
    async dragEnd(position, ctrlPressed) {
        if (!this.dragState) {
            return; // this happens when unrelated mouseup events are fired anywhere in the app
        }
        const pros = [];
        pros.push(RenderManager_1.renderManager.removeEventListenerFrom(indexHtmlIds.htmlId, 'mousemove', { priority: RenderManager_1.RenderPriority.RESPONSIVE }));
        pros.push(RenderManager_1.renderManager.removeClassFrom(indexHtmlIds.htmlId, styleAdapter_1.style.getClass('disableUserSelect'), RenderManager_1.RenderPriority.RESPONSIVE));
        if (this.dragState.draggingStarted) {
            pros.push(this.dragState.onDragEnd(position, ctrlPressed));
        }
        this.dragState = null;
        await Promise.all(pros);
    }
    async cancelDrag(elementId) {
        if (!this.dragState) {
            util_1.util.logWarning(`MouseDownDragManager::cancelDrag(${elementId}) called but dragging is not in progress.`);
            return;
        }
        if (this.dragState.elementId !== elementId) {
            util_1.util.logWarning(`MouseDownDragManager::cancelDrag(${elementId}) called but dragging is in progress for '${this.dragState.elementId}' not for '${elementId}'.`);
        }
        await this.dragEnd(this.dragState.latest.mousePosition, this.dragState.latest.ctrlPressed);
    }
}
exports.mouseDownDragManager = new MouseDownDragManager();
