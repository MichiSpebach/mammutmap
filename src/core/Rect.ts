import { Position } from './shape/Position'
import { Shape } from './shape/Shape'

// TODO: move into shape
export abstract class Rect<POSITION extends Position<POSITION>> extends Shape<POSITION> {
  public readonly x: number
  public readonly y: number
  public readonly width: number
  public readonly height: number

  public constructor(x: number, y: number, width: number, height: number) {
    super()
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }

  public isPositionInside(position: POSITION, epsilon: number = 0): boolean {
    const x: number = position.getX()
    const y: number = position.getY()
    return x >= this.x-epsilon && y >= this.y-epsilon && x <= this.getRightX()+epsilon && y <= this.getBottomY()+epsilon
  }

  public getRightX() {
    return this.x+this.width
  }

  public getBottomY() {
    return this.y+this.height
  }

  public getMidPosition(): POSITION {
    return this.buildPosition(this.x + this.width/2, this.y + this.height/2)
  }

  public getTopLeftPosition(): POSITION {
      return this.buildPosition(this.x, this.y)
  }

  public getTopRightPosition(): POSITION {
      return this.buildPosition(this.getRightX(), this.y)
  }

  public getBottomRightPosition(): POSITION {
      return this.buildPosition(this.getRightX(), this.getBottomY())
  }

  public getBottomLeftPosition(): POSITION {
      return this.buildPosition(this.x, this.getBottomY())
  }

  public isInsideOrEqual(other: Rect<POSITION>): boolean {
    const maxX: number = this.width + this.x
    const maxY: number = this.height + this.y
    const otherMaxX: number = other.width + other.x
    const otherMaxY: number = other.height + other.y
    return this.x >= other.x && maxX <= otherMaxX && this.y >= other.y && maxY <= otherMaxY
  }

  public isOverlappingWith(other: Rect<POSITION>): boolean {
    return this.isPositionInside(other.getTopLeftPosition())
      || this.isPositionInside(other.getBottomRightPosition())
      || other.isPositionInside(this.getTopRightPosition())
      || other.isPositionInside(this.getBottomLeftPosition())
  }

  public calculateIntersectionsWithLine(line: {from: POSITION, to: POSITION}): POSITION[] {
    const intersections: POSITION[] = []
    const fromX: number = line.from.getX()
    const fromY: number = line.from.getY()
    const deltaX: number = line.to.getX() - fromX
    const deltaY: number = line.to.getY() - fromY

    const distanceToTop: number = this.y - fromY
    const intersectionTop = this.buildPosition(fromX + distanceToTop * (deltaX/deltaY), this.y)
    if (this.isPositionInside(intersectionTop) && intersectionTop.isBetweenCoordinateWise(line)) {
      intersections.push(intersectionTop)
    }

    const distanceToBottom: number = this.getBottomY() - fromY
    const intersectionBottom = this.buildPosition(fromX + distanceToBottom * (deltaX/deltaY), this.getBottomY())
    if (this.isPositionInside(intersectionBottom) && intersectionBottom.isBetweenCoordinateWise(line)) {
      intersections.push(intersectionBottom)
    }

    const distanceToLeft: number = this.x - fromX
    const intersectionLeft = this.buildPosition(this.x, fromY + distanceToLeft * (deltaY/deltaX))
    if (this.isPositionInside(intersectionLeft) && intersectionLeft.isBetweenCoordinateWise(line)
    && !intersectionLeft.equals(intersectionTop) && !intersectionLeft.equals(intersectionBottom)) {
      intersections.push(intersectionLeft)
    }

    const distanceToRight: number = this.getRightX() - fromX
    const intersectionRight = this.buildPosition(this.getRightX(), fromY + distanceToRight * (deltaY/deltaX))
    if (this.isPositionInside(intersectionRight) && intersectionRight.isBetweenCoordinateWise(line)
    && !intersectionRight.equals(intersectionTop) && !intersectionRight.equals(intersectionBottom)) {
      intersections.push(intersectionRight)
    }

    return intersections
  }

  protected abstract buildPosition(x: number, y: number): POSITION

}
