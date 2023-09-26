"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grid = exports.Grid = void 0;
const RenderManager_1 = require("../RenderManager");
const indexHtmlIds = require("../indexHtmlIds");
const LocalPosition_1 = require("../shape/LocalPosition");
class Grid {
    constructor() {
        this.id = 'grid';
        this.idLayer1Columns = this.id + 'Layer1Columns';
        this.idLayer1Rows = this.id + 'Layer1Rows';
        this.idRenderedInto = null;
    }
    static getStepSizeOfLayer(layer) {
        return 8 / Math.pow(2, layer);
    }
    //private layer2ColumnsRendered: boolean = false // TODO: implement depending on current clientRectSize
    //private layer2RowsRendered: boolean = false
    async renderInto(idToRenderInto, priority) {
        if (!this.idRenderedInto) {
            this.idRenderedInto = idToRenderInto;
            const style = 'position:absolute;width:100%;height:100%;';
            const html = '<div id="' + this.id + '" style="' + style + '">' + this.formLayer1Columns() + this.formLayer1Rows() + '</div>';
            await RenderManager_1.renderManager.setContentTo(idToRenderInto, html, priority);
        }
        else if (this.idRenderedInto !== idToRenderInto) {
            this.idRenderedInto = idToRenderInto;
            await RenderManager_1.renderManager.appendChildTo(idToRenderInto, this.id, priority);
        }
    }
    async unrenderFrom(idToUnrenderFrom, priority) {
        if (this.idRenderedInto !== idToUnrenderFrom) {
            return;
        }
        this.idRenderedInto = indexHtmlIds.unplacedElementsId;
        await RenderManager_1.renderManager.appendChildTo(indexHtmlIds.unplacedElementsId, this.id, priority);
    }
    formLayer1Columns() {
        return this.formLayerLines(this.idLayer1Columns, Grid.layer1Lines, 'left', 'width:1px;height:100%;');
    }
    formLayer1Rows() {
        return this.formLayerLines(this.idLayer1Rows, Grid.layer1Lines, 'top', 'width:100%;height:1px;');
    }
    formLayerLines(id, steps, startingEdge, sizeStyle) {
        let lines = '';
        for (const step of steps) {
            if (step === 0 || step === 100) {
                continue;
            }
            lines += `<div style="position:absolute;${startingEdge}:${step}%;${sizeStyle}background-color:#aaa8;"></div>`;
        }
        return '<div id="' + id + '" style="position:absolute;width:100%;height:100%">' + lines + '</div>';
    }
    roundToGridPosition(position) {
        return Grid.roundToLayer1GridScalar(position);
    }
    static roundToLayer1GridPosition(position) {
        return new LocalPosition_1.LocalPosition(this.roundToLayer1GridScalar(position.percentX), this.roundToLayer1GridScalar(position.percentY));
    }
    static roundToLayer1GridScalar(position) {
        let nearestGridPosition = 50;
        const stepSize = this.getStepSizeOfLayer(1);
        const gridPosition = Math.round(position / stepSize) * stepSize;
        if (Math.abs(position - gridPosition) < Math.abs(position - nearestGridPosition)) {
            nearestGridPosition = gridPosition;
        }
        return nearestGridPosition;
    }
}
exports.Grid = Grid;
Grid.layer1Lines = [
    4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 50, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96
];
exports.grid = new Grid();
