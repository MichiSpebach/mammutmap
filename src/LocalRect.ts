import { LocalPosition } from './box/Transform'
import { Rect } from './Rect'

export class LocalRect extends Rect<LocalPosition> {

    // TODO: should also be available in ClientRect, make generic and move into Rect
    public getTopLeftPosition(): LocalPosition {
        return new LocalPosition(this.x, this.y)
    }

    // TODO: should also be available in ClientRect, make generic and move into Rect
    public getTopRightPosition(): LocalPosition {
        return new LocalPosition(this.getRightX(), this.y)
    }

    // TODO: should also be available in ClientRect, make generic and move into Rect
    public getBottomRightPosition(): LocalPosition {
        return new LocalPosition(this.getRightX(), this.getBottomY())
    }

    // TODO: should also be available in ClientRect, make generic and move into Rect
    public getBottomLeftPosition(): LocalPosition {
        return new LocalPosition(this.x, this.getBottomY())
    }

    // TODO: make generic and move into Rect
    public isPositionInside(position: LocalPosition): boolean {
        return this.isPositionInsideRaw(position.percentX, position.percentY)
    }

    // TODO: make generic and move into Rect
    public isOverlappingWith(other: LocalRect): boolean {
      return this.isPositionInside(other.getTopLeftPosition())
        || this.isPositionInside(other.getBottomRightPosition())
        || other.isPositionInside(this.getTopRightPosition())
        || other.isPositionInside(this.getBottomLeftPosition())
    }

}
