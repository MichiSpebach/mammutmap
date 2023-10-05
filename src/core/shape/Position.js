"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
class Position {
    isBetweenCoordinateWise(line) {
        const leftLineEnd = Math.min(line.from.getX(), line.to.getX());
        const rightLineEnd = Math.max(line.from.getX(), line.to.getX());
        const topLineEnd = Math.min(line.from.getY(), line.to.getY());
        const bottomLineEnd = Math.max(line.from.getY(), line.to.getY());
        return this.getX() >= leftLineEnd && this.getX() <= rightLineEnd && this.getY() >= topLineEnd && this.getY() <= bottomLineEnd;
    }
    equals(other) {
        return other.getX() === this.getX() && other.getY() === this.getY();
    }
}
exports.Position = Position;
