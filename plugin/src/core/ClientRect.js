"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientRect = void 0;
const ClientPosition_1 = require("./shape/ClientPosition");
const Rect_1 = require("./Rect");
// TODO: move into shape
class ClientRect extends Rect_1.Rect {
    // TODO: works same as in LocalRect, make generic and move into Rect
    static fromPositions(position1, position2) {
        // TODO: handle case that positions are swapped
        return new ClientRect(position1.x, position1.y, position2.x - position1.x, position2.y - position1.y);
    }
    // TODO: works same as in LocalRect, make generic and move into Rect
    static createEnclosing(rects) {
        const minX = Math.min(...rects.map(rect => rect.x));
        const minY = Math.min(...rects.map(rect => rect.y));
        const maxX = Math.max(...rects.map(rect => rect.x + rect.width));
        const maxY = Math.max(...rects.map(rect => rect.y + rect.height));
        return new ClientRect(minX, minY, maxX - minX, maxY - minY);
    }
    buildPosition(x, y) {
        return new ClientPosition_1.ClientPosition(x, y);
    }
}
exports.ClientRect = ClientRect;
