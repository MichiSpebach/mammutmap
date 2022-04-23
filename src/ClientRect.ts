import { ClientPosition } from './box/Transform'
import { Rect } from './Rect'

export class ClientRect extends Rect<ClientPosition> {

    // TODO: should also be available in LocalRect, make generic and move into Rect
    public static fromPositions(position1: ClientPosition, position2: ClientPosition): ClientRect {
        // TODO: handle case that positions are swapped
        return new ClientRect(
            position1.x,
            position1.y,
            position2.x-position1.x,
            position2.y-position1.y
        )
    }

    // TODO: make generic and move into Rect
    public isPositionInside(position: ClientPosition): boolean {
        return this.isPositionInsideRaw(position.x, position.y)
    }

    // TODO: should also be available in LocalRect, make generic and move into Rect
    public calculateIntersectionsWithLine(line: {from: ClientPosition, to: ClientPosition}): ClientPosition[] {
        const intersections: ClientPosition[] = []
        const deltaX: number = line.to.x - line.from.x
        const deltaY: number = line.to.y - line.from.y

        const distanceToTop: number = this.y - line.from.y
        const intersectionTop = new ClientPosition(line.from.x + distanceToTop * (deltaX/deltaY), this.y)
        if (this.isPositionInside(intersectionTop) && intersectionTop.isBetweenCoordinateWise(line)) {
          intersections.push(intersectionTop)
        }

        const distanceToBottom: number = this.getBottomY() - line.from.y
        const intersectionBottom = new ClientPosition(line.from.x + distanceToBottom * (deltaX/deltaY), this.getBottomY())
        if (this.isPositionInside(intersectionBottom) && intersectionBottom.isBetweenCoordinateWise(line)) {
          intersections.push(intersectionBottom)
        }

        const distanceToLeft: number = this.x - line.from.x
        const intersectionLeft = new ClientPosition(this.x, line.from.y + distanceToLeft * (deltaY/deltaX))
        if (this.isPositionInside(intersectionLeft) && intersectionLeft.isBetweenCoordinateWise(line)
        && !intersectionLeft.equals(intersectionTop) && !intersectionLeft.equals(intersectionBottom)) {
          intersections.push(intersectionLeft)
        }

        const distanceToRight: number = this.getRightX() - line.from.x
        const intersectionRight = new ClientPosition(this.getRightX(), line.from.y + distanceToRight * (deltaY/deltaX))
        if (this.isPositionInside(intersectionRight) && intersectionRight.isBetweenCoordinateWise(line)
        && !intersectionRight.equals(intersectionTop) && !intersectionRight.equals(intersectionBottom)) {
          intersections.push(intersectionRight)
        }

        return intersections
      }

}
