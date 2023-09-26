"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalRect = void 0;
const LocalPosition_1 = require("./shape/LocalPosition");
const Rect_1 = require("./Rect");
// TODO: move into shape
class LocalRect extends Rect_1.Rect {
    // TODO: works same as in ClientRect, make generic and move into Rect
    static fromPositions(position1, position2) {
        // TODO: handle case that positions are swapped
        return new LocalRect(position1.percentX, position1.percentY, position2.percentX - position1.percentX, position2.percentY - position1.percentY);
    }
    // TODO: works same as in ClientRect, make generic and move into Rect
    static createEnclosing(rects) {
        const minX = Math.min(...rects.map(rect => rect.x));
        const minY = Math.min(...rects.map(rect => rect.y));
        const maxX = Math.max(...rects.map(rect => rect.x + rect.width));
        const maxY = Math.max(...rects.map(rect => rect.y + rect.height));
        return new LocalRect(minX, minY, maxX - minX, maxY - minY);
    }
    buildPosition(x, y) {
        return new LocalPosition_1.LocalPosition(x, y);
    }
}
exports.LocalRect = LocalRect;
