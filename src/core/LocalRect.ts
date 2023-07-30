import { LocalPosition } from './shape/LocalPosition'
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

    // TODO: works same as in ClientRect, make generic and move into Rect
    public static createEnclosing(rects: LocalRect[]): LocalRect {
      const minX: number = Math.min(...rects.map(rect => rect.x))
      const minY: number = Math.min(...rects.map(rect => rect.y))
      const maxX: number = Math.max(...rects.map(rect => rect.x + rect.width))
      const maxY: number = Math.max(...rects.map(rect => rect.y + rect.height))
      return new LocalRect(minX, minY, maxX - minX, maxY - minY)
    }

    protected buildPosition(x: number, y: number): LocalPosition {
      return new LocalPosition(x, y)
    }

}
