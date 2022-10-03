"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidactedLink = void 0;
const pluginFacade_1 = require("../../dist/pluginFacade");
const colors = ['green', 'blue', 'yellow', 'orange', 'magenta', 'aqua', 'lime', 'purple', 'teal'];
class DidactedLink extends pluginFacade_1.LinkImplementation {
    static getSuperClass() {
        return Object.getPrototypeOf(DidactedLink.prototype).constructor;
    }
    getColor() {
        let toBoxId;
        const dropTargetIfRenderInProgress = this.getTo().getDropTargetIfRenderInProgress();
        if (dropTargetIfRenderInProgress) {
            toBoxId = dropTargetIfRenderInProgress.getId();
        }
        else {
            const path = this.getData().to.path;
            toBoxId = path[path.length - 1].boxId;
        }
        const hash = toBoxId.charCodeAt(0) + toBoxId.charCodeAt(toBoxId.length / 2) + toBoxId.charCodeAt(toBoxId.length - 1);
        return colors[hash % colors.length];
    }
}
exports.DidactedLink = DidactedLink;
