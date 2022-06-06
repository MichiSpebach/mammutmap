import { Position } from '../box/Transform'
import { Shape } from './Shape'

export abstract class Circle<POSITION extends Position<POSITION>> extends Shape<POSITION> {
  public readonly x: number
  public readonly y: number
  public readonly radius: number

  public constructor(x: number, y: number, radius: number) {
    super()
    this.x = x
    this.y = y
    this.radius = radius
  }

  public calculateIntersectionsWithLine(line: {from: POSITION, to: POSITION}): POSITION[] {
    // TODO: replace with real implementation
    const deltaX: number = line.to.getX() - line.from.getX()
    const deltaY: number = line.to.getY() - line.from.getY()
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) {
        return [this.buildPosition(this.x+this.radius, this.y)]
      } else {
        return [this.buildPosition(this.x-this.radius, this.y)]
      }
    } else {
      if (deltaY > 0) {
        return [this.buildPosition(this.x, this.y+this.radius)]
      } else {
        return [this.buildPosition(this.x, this.y-this.radius)]
      }
    }
  }

  protected abstract buildPosition(x: number, y: number): POSITION

}
