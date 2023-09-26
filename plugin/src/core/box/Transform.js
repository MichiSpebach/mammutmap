"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transform = void 0;
const LocalRect_1 = require("../LocalRect");
const ClientRect_1 = require("../ClientRect");
const Grid_1 = require("./Grid");
const LocalPosition_1 = require("../shape/LocalPosition");
const ClientPosition_1 = require("../shape/ClientPosition");
class Transform {
    constructor(referenceBox) {
        this.referenceBox = referenceBox;
    }
    async clientToLocalRect(clientRect) {
        const topLeft = this.clientToLocalPosition(clientRect.getTopLeftPosition());
        const bottomRight = this.clientToLocalPosition(clientRect.getBottomRightPosition());
        return LocalRect_1.LocalRect.fromPositions(await topLeft, await bottomRight);
    }
    async localToClientRect(localRect) {
        const clientPositions = await this.localToClientPositions([
            localRect.getTopLeftPosition(),
            localRect.getBottomRightPosition()
        ]);
        return ClientRect_1.ClientRect.fromPositions(clientPositions[0], clientPositions[1]);
    }
    async clientToLocalPosition(position) {
        const clientRect = await this.referenceBox.getClientRect();
        const percentX = (position.x - clientRect.x) / clientRect.width * 100;
        const percentY = (position.y - clientRect.y) / clientRect.height * 100;
        return new LocalPosition_1.LocalPosition(percentX, percentY);
    }
    /** same result as box.getParent().clientToLocalPosition(..) but this also works with rootBox where getParent() does not work */
    async clientToParentLocalPosition(position) {
        const parentClientRect = await this.referenceBox.getParentClientRect();
        return new LocalPosition_1.LocalPosition((position.x - parentClientRect.x) / parentClientRect.width * 100, (position.y - parentClientRect.y) / parentClientRect.height * 100);
    }
    async localToClientPosition(localPosition) {
        return (await this.localToClientPositions([localPosition]))[0];
    }
    async localToClientPositions(localPositions) {
        const clientRect = await this.referenceBox.getClientRect(); // important that only called once, would lead to branched recursion otherwise
        return localPositions.map(localPosition => {
            const clientX = clientRect.x + (localPosition.percentX / 100) * clientRect.width;
            const clientY = clientRect.y + (localPosition.percentY / 100) * clientRect.height;
            return new ClientPosition_1.ClientPosition(clientX, clientY);
        });
    }
    fromParentPosition(positionInParentCoords) {
        const rect = this.referenceBox.getLocalRect();
        return new LocalPosition_1.LocalPosition((positionInParentCoords.percentX - rect.x) * (100 / rect.width), (positionInParentCoords.percentY - rect.y) * (100 / rect.height));
    }
    fromParentRect(rectInParentCoords) {
        return LocalRect_1.LocalRect.fromPositions(this.fromParentPosition(rectInParentCoords.getTopLeftPosition()), this.fromParentPosition(rectInParentCoords.getBottomRightPosition()));
    }
    toParentPosition(position) {
        const rect = this.referenceBox.getLocalRect();
        return new LocalPosition_1.LocalPosition(rect.x + position.percentX * (rect.width / 100), rect.y + position.percentY * (rect.height / 100));
    }
    toParentRect(rect) {
        return LocalRect_1.LocalRect.fromPositions(this.toParentPosition(rect.getTopLeftPosition()), this.toParentPosition(rect.getBottomRightPosition()));
    }
    innerCoordsRecursiveToLocal(innerBox, innerPosition) {
        let tempBox = innerBox;
        let tempPosition = innerPosition;
        while (tempBox !== this.referenceBox) {
            tempPosition = tempBox.transform.toParentPosition(tempPosition);
            tempBox = tempBox.getParent(); // TODO: warn if called with bad arguments?
        }
        return tempPosition;
    }
    innerRectRecursiveToLocal(innerBox, rectInInnerBoxCoords) {
        return LocalRect_1.LocalRect.fromPositions(this.innerCoordsRecursiveToLocal(innerBox, rectInInnerBoxCoords.getTopLeftPosition()), this.innerCoordsRecursiveToLocal(innerBox, rectInInnerBoxCoords.getBottomRightPosition()));
    }
    async getNearestGridPositionOfOtherTransform(position, other) {
        const clientPositionSnappedToGrid = await other.getNearestGridPositionInClientCoords(position);
        return this.referenceBox.transform.clientToLocalPosition(clientPositionSnappedToGrid);
    }
    async getNearestGridPositionInClientCoords(position) {
        const localPosition = await this.clientToLocalPosition(position);
        const localPositionSnappedToGrid = this.getNearestGridPositionOf(localPosition);
        return await this.localToClientPosition(localPositionSnappedToGrid);
    }
    // remove? not really practical
    async getNearestGridPositionIfNearbyOrIdentity(position) {
        const localPosition = await this.clientToLocalPosition(position);
        const localPositionSnappedToGrid = this.getNearestGridPositionOf(localPosition);
        const clientPositionSnappedToGrid = await this.localToClientPosition(localPositionSnappedToGrid);
        let localX = localPosition.percentX;
        let localY = localPosition.percentY;
        if (Math.abs(position.x - clientPositionSnappedToGrid.x) < 25) {
            localX = localPositionSnappedToGrid.percentX;
        }
        if (Math.abs(position.y - clientPositionSnappedToGrid.y) < 25) {
            localY = localPositionSnappedToGrid.percentY;
        }
        return new LocalPosition_1.LocalPosition(localX, localY);
    }
    getNearestGridPositionOf(position) {
        return new LocalPosition_1.LocalPosition(this.roundToGridPosition(position.percentX), this.roundToGridPosition(position.percentY));
    }
    roundToGridPosition(position) {
        return Grid_1.grid.roundToGridPosition(position);
    }
}
exports.Transform = Transform;
