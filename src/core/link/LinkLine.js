"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkLine = exports.LinkLineImplementation = exports.override = void 0;
const styleAdapter_1 = require("../styleAdapter");
function override(implementation) {
    exports.LinkLineImplementation = implementation;
}
exports.override = override;
class LinkLine {
    static new(id, referenceLink) {
        return new exports.LinkLineImplementation(id, referenceLink);
    }
    constructor(id, referenceLink) {
        this.rendered = false;
        this.id = id;
        this.referenceLink = referenceLink;
    }
    getId() {
        return this.id;
    }
    getMainLineId() {
        return this.id + 'Main';
    }
    getTargetLineId() {
        return this.id + 'Target';
    }
    async formInnerHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress, hoveringOver) {
        // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
        // TODO: move coordinates to svg element, svg element only as big as needed?
        let lineHtml = this.formMainLineHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress);
        if ((draggingInProgress || hoveringOver) /*&& (this.from.isFloatToBorder() || this.to.isFloatToBorder())*/) { // TODO: activate floatToBorder option
            lineHtml = await this.formTargetLineHtml(draggingInProgress) + lineHtml;
        }
        return lineHtml;
    }
    formMainLineHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress) {
        const positionHtml = 'x1="' + fromInManagingBoxCoords.percentX + '%" y1="' + fromInManagingBoxCoords.percentY + '%" x2="' + toInManagingBoxCoords.percentX + '%" y2="' + toInManagingBoxCoords.percentY + '%"';
        return `<line id="${this.getMainLineId()}" ${positionHtml} ${this.formLineClassHtml()} ${this.formLineStyleHtml(draggingInProgress)}/>`;
    }
    async formTargetLineHtml(draggingInProgress) {
        const fromTargetInManagingBoxCoordsPromise = this.referenceLink.from.getTargetPositionInManagingBoxCoords();
        const toTargetInManagingBoxCoords = await this.referenceLink.to.getTargetPositionInManagingBoxCoords();
        const fromTargetInManagingBoxCoords = await fromTargetInManagingBoxCoordsPromise;
        const positionHtml = 'x1="' + fromTargetInManagingBoxCoords.percentX + '%" y1="' + fromTargetInManagingBoxCoords.percentY + '%" x2="' + toTargetInManagingBoxCoords.percentX + '%" y2="' + toTargetInManagingBoxCoords.percentY + '%"';
        return `<line id="${this.getTargetLineId()}" ${positionHtml} ${this.formLineClassHtml()} ${this.formLineStyleHtml(draggingInProgress)} stroke-dasharray="5"/>`;
    }
    formLineClassHtml() {
        const highlightClass = this.referenceLink.isHighlight() ? ' ' + this.referenceLink.getHighlightClass() : '';
        return `class="${styleAdapter_1.style.getHighlightTransitionClass()}${highlightClass}"`;
    }
    formLineStyleHtml(draggingInProgress) {
        const pointerEventsStyle = draggingInProgress ? '' : 'pointer-events:auto;';
        return 'style="stroke:' + this.referenceLink.getColor() + ';stroke-width:2px;' + pointerEventsStyle + '"';
    }
}
exports.LinkLine = LinkLine;
exports.LinkLineImplementation = LinkLine;
