"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DragEventDragManager = void 0;
const RenderManager_1 = require("./RenderManager");
const ClientPosition_1 = require("./shape/ClientPosition");
class DragEventDragManager {
    isUsingNativeDragEvents() {
        return true;
    }
    async addDraggable(options) {
        await Promise.all([
            RenderManager_1.renderManager.addEventListenerTo(options.elementId, 'mousedown', () => {
                /* only to catch mousedown, because mouseDownDragManager would be disturbed by it */
            }, options.priority),
            RenderManager_1.renderManager.addDragListenerTo(options.elementId, 'dragstart', (clientX, clientY, ctrlPressed) => {
                options.onDragStart({ position: new ClientPosition_1.ClientPosition(clientX, clientY), ctrlPressed, cursor: 'auto', targetPathElementIds: [] });
            }, options.priority),
            RenderManager_1.renderManager.addDragListenerTo(options.elementId, 'drag', (clientX, clientY, ctrlPressed) => {
                options.onDrag(new ClientPosition_1.ClientPosition(clientX, clientY), ctrlPressed);
            }, options.priority),
            RenderManager_1.renderManager.addDragListenerTo(options.elementId, 'dragend', (clientX, clientY, ctrlPressed) => {
                options.onDragEnd(new ClientPosition_1.ClientPosition(clientX, clientY), ctrlPressed);
            }, options.priority)
        ]);
    }
    async removeDraggable(elementId, priority) {
        await Promise.all([
            RenderManager_1.renderManager.removeEventListenerFrom(elementId, 'mousedown', { priority }),
            RenderManager_1.renderManager.removeEventListenerFrom(elementId, 'dragstart', { priority }),
            RenderManager_1.renderManager.removeEventListenerFrom(elementId, 'drag', { priority }),
            RenderManager_1.renderManager.removeEventListenerFrom(elementId, 'dragend', { priority })
        ]);
    }
}
exports.DragEventDragManager = DragEventDragManager;
