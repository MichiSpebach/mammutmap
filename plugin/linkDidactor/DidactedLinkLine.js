"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidactedLinkLine = void 0;
const LinkLine_1 = require("../../dist/link/LinkLine");
const util_1 = require("../../dist/util");
const linkDidactorSettings = require("./linkDidactorSettings");
class DidactedLinkLine extends LinkLine_1.LinkLineImplementation {
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
                return false;
            default:
                util_1.util.logWarning(`Unexpected LinkTagMode ${mode}`); // should also never be called if link is 'notDisplayed' at all
                return true;
        }
    }
}
exports.DidactedLinkLine = DidactedLinkLine;
