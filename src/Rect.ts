import { ClientPosition } from './box/Transform'

export class Rect {
  public readonly x: number
  public readonly y: number
  public readonly width: number
  public readonly height: number

  public constructor(x: number, y: number, width: number, height: number) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  public isPositionInside(x: number, y: number): boolean {
    return x >= this.x && y >= this.y && x <= this.getRightX() && y <= this.getBottomY()
  }

  // TODO: should also be possible for type LocalPosition, or introduce interface for Position
  public isClientPositionInside(position: ClientPosition): boolean {
    return this.isPositionInside(position.x, position.y)
  }

  public getRightX() {
    return this.x+this.width
  }

  public getBottomY() {
    return this.y+this.height
  }

  // TODO: should also be possible for type LocalPosition, or introduce interface for Position
  public calculateIntersectionsWithLine(line: {from: ClientPosition, to: ClientPosition}): ClientPosition[] {
    const intersections: ClientPosition[] = []
    const deltaX: number = line.to.x - line.from.x
    const deltaY: number = line.to.y - line.from.y

    const distanceToTop: number = this.y - line.from.y
    const intersectionTop = new ClientPosition(line.from.x + distanceToTop * (deltaX/deltaY), this.y)
    if (this.isClientPositionInside(intersectionTop) && intersectionTop.isBetweenCoordinateWise(line)) {
      intersections.push(intersectionTop)
    }

    const distanceToBottom: number = this.getBottomY() - line.from.y
    const intersectionBottom = new ClientPosition(line.from.x + distanceToBottom * (deltaX/deltaY), this.getBottomY())
    if (this.isClientPositionInside(intersectionBottom) && intersectionBottom.isBetweenCoordinateWise(line)) {
      intersections.push(intersectionBottom)
    }

    const distanceToLeft: number = this.x - line.from.x
    const intersectionLeft = new ClientPosition(this.x, line.from.y + distanceToLeft * (deltaY/deltaX))
    if (this.isClientPositionInside(intersectionLeft) && intersectionLeft.isBetweenCoordinateWise(line)) {
      intersections.push(intersectionLeft)
    }

    const distanceToRight: number = this.getRightX() - line.from.x
    const intersectionRight = new ClientPosition(this.getRightX(), line.from.y + distanceToRight * (deltaY/deltaX))
    if (this.isClientPositionInside(intersectionRight) && intersectionRight.isBetweenCoordinateWise(line)) {
      intersections.push(intersectionRight)
    }

    return intersections
  }

}
