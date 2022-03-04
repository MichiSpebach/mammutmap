import { LocalPosition } from './box/Transform'

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

  // TODO: should also be possible for type ClientPosition, or introduce interface for Position
  public isLocalPositionInside(position: LocalPosition): boolean {
    return this.isPositionInside(position.percentX, position.percentY)
  }

  public getRightX() {
    return this.x+this.width
  }

  public getBottomY() {
    return this.y+this.height
  }

  // TODO: should also be possible for type ClientPosition, or introduce interface for Position
  public calculateIntersectionWithLine(line: {from: LocalPosition, to: LocalPosition}): LocalPosition|undefined {
    const deltaX: number = line.to.percentX - line.from.percentX
    const deltaY: number = line.to.percentY - line.from.percentY

    const distanceToTop: number = this.y - line.from.percentY
    const intersectionTop = new LocalPosition(line.from.percentX + distanceToTop * (deltaX/deltaY), this.y)
    if (this.isLocalPositionInside(intersectionTop) && intersectionTop.isBetweenCoordinateWise(line)) {
      return intersectionTop
    }

    const distanceToBottom: number = this.getBottomY() - line.from.percentY
    const intersectionBottom = new LocalPosition(line.from.percentX + distanceToBottom * (deltaX/deltaY), this.getBottomY())
    if (this.isLocalPositionInside(intersectionBottom) && intersectionBottom.isBetweenCoordinateWise(line)) {
      return intersectionBottom
    }

    const distanceToLeft: number = this.x - line.from.percentX
    const intersectionLeft = new LocalPosition(this.x, line.from.percentY + distanceToLeft * (deltaY/deltaX))
    if (this.isLocalPositionInside(intersectionLeft) && intersectionLeft.isBetweenCoordinateWise(line)) {
      return intersectionLeft
    }

    const distanceToRight: number = this.getRightX() - line.from.percentX
    const intersectionRight = new LocalPosition(this.getRightX(), line.from.percentY + distanceToRight * (deltaY/deltaX))
    if (this.isLocalPositionInside(intersectionRight) && intersectionRight.isBetweenCoordinateWise(line)) {
      return intersectionRight
    }

    return undefined
  }

}
