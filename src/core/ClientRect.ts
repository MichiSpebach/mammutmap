import { ClientPosition } from './shape/ClientPosition'
import { Rect } from './Rect'

// TODO: move into shape
export class ClientRect extends Rect<ClientPosition> {

    public static of(clientRect: {x: number, y: number, width: number, height: number}): ClientRect {
        return new ClientRect(clientRect.x, clientRect.y, clientRect.width, clientRect.height)
    }

    // TODO: works same as in LocalRect, make generic and move into Rect
    public static fromPositions(position1: ClientPosition, position2: ClientPosition): ClientRect {
        // TODO: handle case that positions are swapped
        return new ClientRect(
            position1.x,
            position1.y,
            position2.x-position1.x,
            position2.y-position1.y
        )
    }

    // TODO: works same as in LocalRect, make generic and move into Rect
    public static createEnclosing(rects: ClientRect[]): ClientRect {
        const minX: number = Math.min(...rects.map(rect => rect.x))
        const minY: number = Math.min(...rects.map(rect => rect.y))
        const maxX: number = Math.max(...rects.map(rect => rect.x + rect.width))
        const maxY: number = Math.max(...rects.map(rect => rect.y + rect.height))
        return new ClientRect(minX, minY, maxX - minX, maxY - minY)
    }

    protected buildPosition(x: number, y: number): ClientPosition {
      return new ClientPosition(x, y)
    }

}
