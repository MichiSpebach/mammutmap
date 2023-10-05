"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoverManager = void 0;
const RenderManager_1 = require("./RenderManager");
const RelocationDragManager_1 = require("./RelocationDragManager");
const ScaleManager_1 = require("./ScaleManager");
const util_1 = require("./util/util");
class HoverManager {
    static isHoveringInProgress() {
        return !!this.state;
    }
    static clear() {
        this.state = null;
    }
    static async addHoverable(hoverable, onHoverOver, onHoverOut) {
        if (this.hoverables.has(hoverable.getId())) {
            util_1.util.logWarning(`HoverManager::addHoverable(..) hoverable with id '${hoverable.getId()}' already exists.`);
        }
        const mouseoverListener = (_clientX, _clientY) => {
            this.onMouseOver(hoverable, onHoverOver, onHoverOut);
        };
        this.hoverables.set(hoverable.getId(), mouseoverListener);
        await RenderManager_1.renderManager.addEventListenerTo(hoverable.getId(), 'mouseover', mouseoverListener);
        const elementHovered = await RenderManager_1.renderManager.isElementHovered(hoverable.getId());
        if (elementHovered) {
            await this.onMouseOver(hoverable, onHoverOver, onHoverOut);
        }
    }
    static async onMouseOver(hoverable, onHoverOver, onHoverOut) {
        if (RelocationDragManager_1.relocationDragManager.isDraggingInProgress() || ScaleManager_1.ScaleManager.isScalingInProgress()) {
            return;
        }
        if (this.state !== null && this.state.hovering === hoverable) {
            return;
        }
        if (this.state !== null) {
            this.state.onHoverOut();
        }
        this.state = { hovering: hoverable, onHoverOut };
        onHoverOver();
    }
    static async removeHoverable(hoverable, callOnHoverOutIfHovered = false) {
        const listener = this.hoverables.get(hoverable.getId());
        if (!listener) {
            util_1.util.logWarning(`HoverManager::removeHoverable(..) hoverable with id '${hoverable.getId()}' not found.`);
        }
        else {
            this.hoverables.delete(hoverable.getId());
            await RenderManager_1.renderManager.removeEventListenerFrom(hoverable.getId(), 'mouseover', { listenerCallback: listener });
        }
        if (this.state !== null && this.state.hovering === hoverable) {
            if (callOnHoverOutIfHovered) {
                this.state.onHoverOut();
            }
            this.state = null;
        }
    }
}
exports.HoverManager = HoverManager;
HoverManager.hoverables = new Map();
HoverManager.state = null;
