"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientPosition = void 0;
const Position_1 = require("./Position");
class ClientPosition extends Position_1.Position {
    constructor(x, y) {
        super();
        this.x = x;
        this.y = y;
    }
    getX() {
        return this.x;
    }
    getY() {
        return this.y;
    }
    calculateDistanceTo(other) {
        return Math.sqrt((this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y));
    }
}
exports.ClientPosition = ClientPosition;
