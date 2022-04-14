import { LocalPosition } from './box/Transform'
import { Rect } from './Rect'

export class LocalRect extends Rect<LocalPosition> {

    // TODO: should also be available in ClientRect, make generic and move into Rect
    public getTopLeftPosition(): LocalPosition {
        return new LocalPosition(this.x, this.y)
    }

    // TODO: should also be available in ClientRect, make generic and move into Rect
    public getBottomRightPosition(): LocalPosition {
        return new LocalPosition(this.getRightX(), this.getBottomY())
    }

}