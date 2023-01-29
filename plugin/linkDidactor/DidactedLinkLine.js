"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidactedLinkLine = void 0;
const pluginFacade_1 = require("../../dist/pluginFacade");
const pluginFacade_2 = require("../../dist/pluginFacade");
const linkDidactorSettings = require("./linkDidactorSettings");
class DidactedLinkLine extends pluginFacade_1.LinkLineImplementation {
    static getSuperClass() {
        return Object.getPrototypeOf(DidactedLinkLine.prototype).constructor;
    }
    formInnerHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress, hoveringOver) {
        if (this.shouldBeVisible()) {
            return super.formInnerHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress, hoveringOver);
        }
        return Promise.resolve('');
    }
    shouldBeVisible() {
        if (this.referenceLink.isHighlight()) {
            return true;
        }
        const tagNames = this.referenceLink.getData().tags;
        const mode = linkDidactorSettings.getComputedModeForLinkTags(tagNames);
        switch (mode) {
            case 'visible':
                return true;
            case 'visibleEnds':
                return false; // TODO: implement smooth disappearing like for 'hidden' as well
            case 'hidden':
                return true; // sometimes visible because of smooth disappearing
            default:
                pluginFacade_2.coreUtil.logWarning(`Unexpected LinkTagMode ${mode}`); // should also never be called if link is 'notRendered' at all
                return true;
        }
    }
}
exports.DidactedLinkLine = DidactedLinkLine;
