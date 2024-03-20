import { LocalRect } from '../LocalRect'
import { ClientRect } from '../ClientRect'
import { Box } from './Box'
import { grid } from './Grid'
import { LocalPosition } from '../shape/LocalPosition'
import { ClientPosition } from '../shape/ClientPosition'

export class Transform {
    private readonly referenceBox: Box

    public constructor(referenceBox: Box) {
        this.referenceBox = referenceBox
    }

    public async clientToLocalRect(clientRect: ClientRect): Promise<LocalRect> {
        const topLeft: Promise<LocalPosition> = this.clientToLocalPosition(clientRect.getTopLeftPosition())
        const bottomRight: Promise<LocalPosition> = this.clientToLocalPosition(clientRect.getBottomRightPosition())
        return LocalRect.fromPositions(await topLeft, await bottomRight)
    }

    public async localToClientRect(localRect: LocalRect): Promise<ClientRect> {
        const clientPositions: ClientPosition[] = await this.localToClientPositions([
            localRect.getTopLeftPosition(), // important that array method is called only once, would lead to branched recursion otherwise
            localRect.getBottomRightPosition()
        ])
        return ClientRect.fromPositions(clientPositions[0], clientPositions[1])
    }

    public async clientToLocalPosition(position: ClientPosition): Promise<LocalPosition> {
        const clientRect: ClientRect = await this.referenceBox.getClientRect()
        const percentX: number = (position.x - clientRect.x) / clientRect.width * 100
        const percentY: number = (position.y - clientRect.y) / clientRect.height * 100
        return new LocalPosition(percentX, percentY)
    }

    /** same result as box.getParent().clientToLocalPosition(..) but this also works with rootBox where getParent() does not work */
    public async clientToParentLocalPosition(position: ClientPosition): Promise<LocalPosition> {
        const parentClientRect: ClientRect = await this.referenceBox.getParentClientRect()
        return new LocalPosition(
            (position.x - parentClientRect.x) / parentClientRect.width * 100,
            (position.y - parentClientRect.y) / parentClientRect.height * 100
        )
    }

    public async localToClientPosition(localPosition: LocalPosition): Promise<ClientPosition> {
        return (await this.localToClientPositions([localPosition]))[0]
    }

    public async localToClientPositions(localPositions: LocalPosition[]): Promise<ClientPosition[]> {
        const clientRect: ClientRect = await this.referenceBox.getClientRect() // important that only called once, would lead to branched recursion otherwise
        return localPositions.map(localPosition => {
            const clientX: number = clientRect.x + (localPosition.percentX / 100) * clientRect.width
            const clientY: number = clientRect.y + (localPosition.percentY / 100) * clientRect.height
            return new ClientPosition(clientX, clientY)
        })
    }

    public fromParentPosition(positionInParentCoords: LocalPosition): LocalPosition {
        const rect: LocalRect = this.referenceBox.getLocalRect()
        return new LocalPosition(
            (positionInParentCoords.percentX-rect.x) * (100/rect.width),
            (positionInParentCoords.percentY-rect.y) * (100/rect.height)
        )
    }

    public fromParentRect(rectInParentCoords: LocalRect): LocalRect {
        return LocalRect.fromPositions(
            this.fromParentPosition(rectInParentCoords.getTopLeftPosition()),
            this.fromParentPosition(rectInParentCoords.getBottomRightPosition())
        )
    }

    public toParentPosition(position: LocalPosition): LocalPosition {
        const rect: LocalRect = this.referenceBox.getLocalRect()
        return new LocalPosition(
            rect.x + position.percentX * (rect.width / 100),
            rect.y + position.percentY * (rect.height / 100)
        )
    }

    public toParentRect(rect: LocalRect): LocalRect {
        return LocalRect.fromPositions(
            this.toParentPosition(rect.getTopLeftPosition()),
            this.toParentPosition(rect.getBottomRightPosition())
        )
    }

    public innerCoordsRecursiveToLocal(innerBox: Box, innerPosition: LocalPosition): LocalPosition {
        let tempBox: Box = innerBox
        let tempPosition: LocalPosition = innerPosition
        while (tempBox !== this.referenceBox) {
            tempPosition = tempBox.transform.toParentPosition(tempPosition)
            tempBox = tempBox.getParent() // TODO: warn if called with bad arguments?
        }
        return tempPosition
    }

    public innerRectRecursiveToLocal(innerBox: Box, rectInInnerBoxCoords: LocalRect): LocalRect {
        return LocalRect.fromPositions(
            this.innerCoordsRecursiveToLocal(innerBox, rectInInnerBoxCoords.getTopLeftPosition()),
            this.innerCoordsRecursiveToLocal(innerBox, rectInInnerBoxCoords.getBottomRightPosition())
        )
    }

    public async getNearestGridPositionOfOtherTransform(position: ClientPosition, other: Transform): Promise<LocalPosition> {
        const clientPositionSnappedToGrid: ClientPosition = await other.getNearestGridPositionInClientCoords(position)
        return this.referenceBox.transform.clientToLocalPosition(clientPositionSnappedToGrid)
    }

    public async getNearestGridPositionInClientCoords(position: ClientPosition): Promise<ClientPosition> {
        const localPosition: LocalPosition = await this.clientToLocalPosition(position)
        const localPositionSnappedToGrid: LocalPosition = this.roundToGridPosition(localPosition)
        return await this.localToClientPosition(localPositionSnappedToGrid)
    }

    // remove? not really practical
    public async getNearestGridPositionIfNearbyOrIdentity(position: ClientPosition): Promise<LocalPosition> {
        const localPosition: LocalPosition = await this.clientToLocalPosition(position)
        const localPositionSnappedToGrid: LocalPosition = this.roundToGridPosition(localPosition)
        const clientPositionSnappedToGrid: ClientPosition = await this.localToClientPosition(localPositionSnappedToGrid)

        let localX: number = localPosition.percentX
        let localY: number = localPosition.percentY
        if (Math.abs(position.x - clientPositionSnappedToGrid.x) < 25) {
            localX = localPositionSnappedToGrid.percentX
        }
        if (Math.abs(position.y - clientPositionSnappedToGrid.y) < 25) {
            localY = localPositionSnappedToGrid.percentY
        }
        return new LocalPosition(localX, localY)
    }

    public roundToGridPosition(position: LocalPosition): LocalPosition {
        return grid.roundToGridPosition(position)
    }

    public roundToGridPositionX(positionX: number): number {
        return grid.roundToGridPositionX(positionX)
    }

    public roundToGridPositionY(positionY: number): number {
        return grid.roundToGridPositionY(positionY)
    }

}