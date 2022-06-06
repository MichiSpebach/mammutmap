import { ClientPosition } from './box/Transform'
import { Rect } from './Rect'

// TODO: move into shape
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

    protected buildPosition(x: number, y: number): ClientPosition {
      return new ClientPosition(x, y)
    }

}
