"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Link_1 = require("../dist/box/Link");
class DidactedLink extends Link_1.Link {
    static initAndPlugin() {
        Link_1.Link.prototype.getColor = DidactedLink.prototype.getColor;
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
        return ['red', 'green', 'blue', 'yellow', 'orange', 'magenta', 'cyan'][toBoxId.charCodeAt(0) % 7];
    }
}
DidactedLink.initAndPlugin();
