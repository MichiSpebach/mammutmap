"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxHeader = void 0;
const RenderManager_1 = require("../../RenderManager");
const RelocationDragManager_1 = require("../../RelocationDragManager");
const styleAdapter_1 = require("../../styleAdapter");
const Settings_1 = require("../../Settings");
const BoxHeaderDraggable_1 = require("./BoxHeaderDraggable");
class BoxHeader {
    constructor(referenceBox) {
        this.rendered = false;
        this.referenceBox = referenceBox;
        this.draggable = new BoxHeaderDraggable_1.BoxHeaderDraggable(this.getId() + 'Inner', this.referenceBox);
    }
    getId() {
        return this.referenceBox.getId() + 'Header';
    }
    async render() {
        const proms = [];
        const draggableHtml = RelocationDragManager_1.relocationDragManager.isUsingNativeDragEvents() && !this.referenceBox.isRoot()
            ? 'draggable="true"'
            : '';
        let html = `<div id="${this.getId() + 'Inner'}" ${draggableHtml} class="${this.getInnerStyleClassNames().join(' ')}">`;
        html += this.formTitleHtml();
        html += '</div>';
        proms.push(RenderManager_1.renderManager.setContentTo(this.getId(), html));
        if (!this.rendered) {
            if (!this.referenceBox.isRoot()) {
                proms.push(RelocationDragManager_1.relocationDragManager.addDraggable(this.draggable));
            }
            this.rendered = true;
        }
        await Promise.all(proms);
    }
    getInnerStyleClassNames() {
        return [styleAdapter_1.style.getBoxHeaderInnerClass()];
    }
    formTitleHtml() {
        return Settings_1.settings.getBoolean('developerMode')
            ? `${this.referenceBox.getName()} (${this.referenceBox.getId()})`
            : this.referenceBox.getName();
    }
    async unrender() {
        if (!this.rendered) {
            return;
        }
        if (!this.referenceBox.isRoot()) {
            await RelocationDragManager_1.relocationDragManager.removeDraggable(this.draggable);
        }
        this.rendered = false; // TODO: implement rerenderAfter(Un)RenderFinished mechanism?
    }
}
exports.BoxHeader = BoxHeader;
