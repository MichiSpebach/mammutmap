"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Rect = void 0;
const Shape_1 = require("./shape/Shape");
// TODO: move into shape
class Rect extends Shape_1.Shape {
    constructor(x, y, width, height) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    isPositionInside(position) {
        const x = position.getX();
        const y = position.getY();
        return x >= this.x && y >= this.y && x <= this.getRightX() && y <= this.getBottomY();
    }
    getRightX() {
        return this.x + this.width;
    }
    getBottomY() {
        return this.y + this.height;
    }
    getMidPosition() {
        return this.buildPosition(this.x + this.width / 2, this.y + this.height / 2);
    }
    getTopLeftPosition() {
        return this.buildPosition(this.x, this.y);
    }
    getTopRightPosition() {
        return this.buildPosition(this.getRightX(), this.y);
    }
    getBottomRightPosition() {
        return this.buildPosition(this.getRightX(), this.getBottomY());
    }
    getBottomLeftPosition() {
        return this.buildPosition(this.x, this.getBottomY());
    }
    isInsideOrEqual(other) {
        const maxX = this.width + this.x;
        const maxY = this.height + this.y;
        const otherMaxX = other.width + other.x;
        const otherMaxY = other.height + other.y;
        return this.x >= other.x && maxX <= otherMaxX && this.y >= other.y && maxY <= otherMaxY;
    }
    isOverlappingWith(other) {
        return this.isPositionInside(other.getTopLeftPosition())
            || this.isPositionInside(other.getBottomRightPosition())
            || other.isPositionInside(this.getTopRightPosition())
            || other.isPositionInside(this.getBottomLeftPosition());
    }
    calculateIntersectionsWithLine(line) {
        const intersections = [];
        const fromX = line.from.getX();
        const fromY = line.from.getY();
        const deltaX = line.to.getX() - fromX;
        const deltaY = line.to.getY() - fromY;
        const distanceToTop = this.y - fromY;
        const intersectionTop = this.buildPosition(fromX + distanceToTop * (deltaX / deltaY), this.y);
        if (this.isPositionInside(intersectionTop) && intersectionTop.isBetweenCoordinateWise(line)) {
            intersections.push(intersectionTop);
        }
        const distanceToBottom = this.getBottomY() - fromY;
        const intersectionBottom = this.buildPosition(fromX + distanceToBottom * (deltaX / deltaY), this.getBottomY());
        if (this.isPositionInside(intersectionBottom) && intersectionBottom.isBetweenCoordinateWise(line)) {
            intersections.push(intersectionBottom);
        }
        const distanceToLeft = this.x - fromX;
        const intersectionLeft = this.buildPosition(this.x, fromY + distanceToLeft * (deltaY / deltaX));
        if (this.isPositionInside(intersectionLeft) && intersectionLeft.isBetweenCoordinateWise(line)
            && !intersectionLeft.equals(intersectionTop) && !intersectionLeft.equals(intersectionBottom)) {
            intersections.push(intersectionLeft);
        }
        const distanceToRight = this.getRightX() - fromX;
        const intersectionRight = this.buildPosition(this.getRightX(), fromY + distanceToRight * (deltaY / deltaX));
        if (this.isPositionInside(intersectionRight) && intersectionRight.isBetweenCoordinateWise(line)
            && !intersectionRight.equals(intersectionTop) && !intersectionRight.equals(intersectionBottom)) {
            intersections.push(intersectionRight);
        }
        return intersections;
    }
}
exports.Rect = Rect;
