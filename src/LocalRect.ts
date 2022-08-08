import { LocalPosition } from './box/Transform'
import { Rect } from './Rect'

// TODO: move into shape
export class LocalRect extends Rect<LocalPosition> {

    // TODO: works same as in ClientRect, make generic and move into Rect
    public static fromPositions(position1: LocalPosition, position2: LocalPosition): LocalRect {
      // TODO: handle case that positions are swapped
      return new LocalRect(
        position1.percentX,
        position1.percentY,
        position2.percentX-position1.percentX,
        position2.percentY-position1.percentY
      )
    }

    protected buildPosition(x: number, y: number): LocalPosition {
      return new LocalPosition(x, y)
    }

}
