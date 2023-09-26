"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalPosition = void 0;
const Position_1 = require("./Position");
class LocalPosition extends Position_1.Position {
    constructor(percentX, percentY) {
        super();
        this.percentX = percentX;
        this.percentY = percentY;
    }
    getX() {
        return this.percentX;
    }
    getY() {
        return this.percentY;
    }
}
exports.LocalPosition = LocalPosition;
