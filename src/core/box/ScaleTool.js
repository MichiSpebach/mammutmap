"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scaleTool = exports.ScaleTool = void 0;
const RenderManager_1 = require("../RenderManager");
const styleAdapter_1 = require("../styleAdapter");
const ScaleManager_1 = require("../ScaleManager");
const indexHtmlIds = require("../indexHtmlIds");
const util_1 = require("../util/util");
class ScaleTool {
    constructor() {
        this.id = 'scaleTool';
        this.idRenderedInto = null;
        this.boxRenderedInto = null; // TODO: use Scalable interface instead?
    }
    getTopId() {
        return this.id + 'Top';
    }
    getBottomId() {
        return this.id + 'Bottom';
    }
    getRightId() {
        return this.id + 'Right';
    }
    getLeftId() {
        return this.id + 'Left';
    }
    getRightBottomId() {
        return this.id + 'RightBottom';
    }
    isScalingInProgress() {
        return ScaleManager_1.ScaleManager.isScalingInProgress();
    }
    getBoxRenderedIntoOrFail() {
        if (!this.boxRenderedInto) {
            util_1.util.logError('ScaleTool can not get boxRenderedInto because it is not set at this state.');
        }
        return this.boxRenderedInto;
    }
    async renderInto(box) {
        if (!this.idRenderedInto) {
            this.idRenderedInto = box.getScaleToolPlaceHolderId();
            this.boxRenderedInto = box;
            const top = this.formLine(this.getTopId(), 'width:100%;height:8px;top:-4px;', 'width:100%;height:2px;top:4px;');
            const bottom = this.formLine(this.getBottomId(), 'width:100%;height:8px;bottom:-4px;', 'width:100%;height:2px;bottom:4px;');
            const right = this.formLine(this.getRightId(), 'width:8px;height:100%;right:-4px;', 'width:2px;height:100%;right:4px;');
            const left = this.formLine(this.getLeftId(), 'width:8px;height:100%;left:-4px;', 'width:2px;height:100%;left:4px;');
            const rightBottom = this.formLine(this.getRightBottomId(), 'width:13px;height:13px;right:-4px;bottom:-4px;', 'width:8px;height:8px;clip-path:polygon(0% 100%, 100% 0%, 100% 100%);');
            await RenderManager_1.renderManager.setContentTo(this.idRenderedInto, '<div id="' + this.id + '">' + top + bottom + right + left + rightBottom + '</div>', RenderManager_1.RenderPriority.RESPONSIVE);
            ScaleManager_1.ScaleManager.addScalable(this);
        }
        else if (this.boxRenderedInto !== box) {
            this.idRenderedInto = box.getScaleToolPlaceHolderId();
            this.boxRenderedInto = box;
            await RenderManager_1.renderManager.appendChildTo(this.idRenderedInto, this.id, RenderManager_1.RenderPriority.RESPONSIVE);
        }
    }
    async unrenderFrom(box) {
        if (this.boxRenderedInto !== box) {
            return;
        }
        this.idRenderedInto = indexHtmlIds.unplacedElementsId;
        this.boxRenderedInto = null;
        await RenderManager_1.renderManager.appendChildTo(this.idRenderedInto, this.id, RenderManager_1.RenderPriority.RESPONSIVE);
    }
    formLine(id, sizeAndPositionStyle, sizeAndPositionStyleLine) {
        return '<div id="' + id + '" style="position:absolute;' + sizeAndPositionStyle + '">'
            + '<div id="' + id + 'Line" class="' + styleAdapter_1.style.getHighlightClass() + '" style="position:absolute;' + sizeAndPositionStyleLine + '"></div>'
            + '</div>';
    }
    async getClientRect() {
        return this.getBoxRenderedIntoOrFail().getClientRect();
    }
    async getParentClientRect() {
        return this.getBoxRenderedIntoOrFail().getParentClientRect();
    }
    roundToParentGridPosition(localPosition) {
        const boxRenderedInto = this.getBoxRenderedIntoOrFail();
        if (boxRenderedInto.isRoot()) {
            return boxRenderedInto.transform.roundToGridPosition(localPosition);
        }
        return boxRenderedInto.getParent().transform.roundToGridPosition(localPosition);
    }
    async scaleStart() {
        if (!this.boxRenderedInto) {
            util_1.util.logWarning('scaleStart is called altough ScaleTool is not rendered into a box => cannot start scaling.');
            return;
        }
        if (!this.boxRenderedInto.isRoot()) {
            await this.boxRenderedInto.getParent().attachGrid(RenderManager_1.RenderPriority.RESPONSIVE);
        }
    }
    async scale(measuresInPercentIfChanged) {
        const boxRenderedInto = this.getBoxRenderedIntoOrFail();
        await boxRenderedInto.updateMeasuresAndBorderingLinks(measuresInPercentIfChanged, RenderManager_1.RenderPriority.RESPONSIVE);
        if (!boxRenderedInto.isRoot()) {
            await boxRenderedInto.getParent().rearrangeBoxesWithoutMapData(boxRenderedInto);
        }
    }
    async scaleEnd() {
        if (!this.boxRenderedInto) {
            util_1.util.logWarning('scaleEnd is called altough ScaleTool is not rendered into a box => cannot end scaling.');
            return;
        }
        const proms = [];
        if (!this.boxRenderedInto.isRoot()) {
            proms.push(this.boxRenderedInto.getParent().detachGrid(RenderManager_1.RenderPriority.RESPONSIVE));
        }
        proms.push(this.boxRenderedInto.saveMapData());
        await Promise.all(proms);
    }
}
exports.ScaleTool = ScaleTool;
exports.scaleTool = new ScaleTool();
