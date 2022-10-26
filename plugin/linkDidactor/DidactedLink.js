"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidactedLink = void 0;
const pluginFacade_1 = require("../../dist/pluginFacade");
const linkDidactorSettings = require("./linkDidactorSettings");
class DidactedLink extends pluginFacade_1.LinkImplementation {
    static getSuperClass() {
        return Object.getPrototypeOf(DidactedLink.prototype).constructor;
    }
    render(priority) {
        if (linkDidactorSettings.getComputedModeForLinkTags(this.getTags()) === 'notRendered') {
            return super.unrender();
        }
        return super.render(priority);
    }
    getColor() {
        const color = linkDidactorSettings.getComputedColorForLinkTags(this.getTags());
        if (color === linkDidactorSettings.boxIdHashColorName) {
            return this.getColorByToBoxIdHash();
        }
        return color;
    }
    getColorByToBoxIdHash() {
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
        return linkDidactorSettings.linkColors[hash % linkDidactorSettings.linkColors.length];
    }
}
exports.DidactedLink = DidactedLink;
