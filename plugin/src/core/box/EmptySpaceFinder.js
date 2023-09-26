"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptySpaceFinder = void 0;
const LocalRect_1 = require("../LocalRect");
const Grid_1 = require("./Grid");
class EmptySpaceFinder {
    constructor(occupiedSpaces) {
        this.occupiedSpaces = occupiedSpaces;
    }
    findEmptySpaces(count) {
        return this.findEmptySpacesWithStartLayer(count, 1);
    }
    findEmptySpacesWithStartLayer(count, startLayer, occupiedSpacesMultiplier = 1, ignoreLeftAndRightMargins = false, ignoreExistingBoxes = false) {
        if (count === 1 && this.occupiedSpaces.length === 0) {
            return [new LocalRect_1.LocalRect(4, 8, 92, 88)];
        }
        const soughtElementCount = count + this.occupiedSpaces.length * occupiedSpacesMultiplier;
        const columnOrRowCount = Math.ceil(Math.sqrt(soughtElementCount));
        let layer = startLayer - 1;
        let stepSize;
        let stepCount;
        do {
            layer++;
            stepSize = Grid_1.Grid.getStepSizeOfLayer(layer);
            stepCount = 100 / stepSize;
        } while (columnOrRowCount * 2 + 1 >= stepCount); // TODO: calculate instead of loop?
        const freeSpaceRatio = EmptySpaceFinder.freeSpaceRatio;
        const columnCount = columnOrRowCount;
        const rowCount = columnOrRowCount;
        const columnSize = Math.floor((stepCount - 1) / columnCount);
        const rowSize = Math.floor((stepCount - 1) / rowCount);
        const xDistanceBetweenBoxes = Math.max(1, Math.round(columnSize * freeSpaceRatio));
        const yDistanceBetweenBoxes = Math.max(1, Math.round(rowSize * freeSpaceRatio));
        const boxSize = Math.min(columnSize - xDistanceBetweenBoxes, rowSize - yDistanceBetweenBoxes);
        let startX = Math.round((stepCount - columnSize * columnCount + xDistanceBetweenBoxes) / 2);
        const startY = Math.round((stepCount - rowSize * rowCount + yDistanceBetweenBoxes) / 2);
        if (ignoreLeftAndRightMargins) {
            startX = 1;
        }
        const rects = [];
        for (let y = startY; y <= stepCount - startY - boxSize; y += rowSize) {
            if (rects.length >= count) {
                break;
            }
            for (let x = startX; x <= stepCount - startX - boxSize; x += columnSize) {
                const rect = new LocalRect_1.LocalRect(x * stepSize, y * stepSize, boxSize * stepSize, boxSize * stepSize);
                if (this.isSpaceEmpty(rect) || ignoreExistingBoxes) {
                    rects.push(rect);
                }
                if (rects.length >= count) {
                    break;
                }
            }
        }
        if (rects.length < count) {
            let nextLayer = layer + 1;
            if (nextLayer > EmptySpaceFinder.maxLayerToFollowNiceRules && !ignoreLeftAndRightMargins) {
                nextLayer = 1;
                occupiedSpacesMultiplier = 4 * nextLayer;
                ignoreLeftAndRightMargins = true;
            }
            else if (nextLayer > EmptySpaceFinder.maxLayerToFollowNiceRules && !ignoreExistingBoxes) {
                nextLayer = 1;
                ignoreExistingBoxes = true;
            }
            return this.findEmptySpacesWithStartLayer(count, nextLayer, occupiedSpacesMultiplier, ignoreLeftAndRightMargins, ignoreExistingBoxes);
        }
        return rects;
    }
    isSpaceEmpty(rect) {
        for (const occupiedSpace of this.occupiedSpaces) {
            if (occupiedSpace.isOverlappingWith(rect)) {
                return false;
            }
        }
        return true;
    }
}
exports.EmptySpaceFinder = EmptySpaceFinder;
EmptySpaceFinder.freeSpaceRatio = 0.4;
EmptySpaceFinder.maxLayerToFollowNiceRules = 3;
