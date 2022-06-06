import { LocalPosition } from './box/Transform'
import { Rect } from './Rect'

// TODO: move into shape
export class LocalRect extends Rect<LocalPosition> {

    protected buildPosition(x: number, y: number): LocalPosition {
      return new LocalPosition(x, y)
    }

}
