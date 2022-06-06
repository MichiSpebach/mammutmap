import { ClientPosition } from '../box/Transform'
import { Circle } from './Circle'

export class ClientCircle extends Circle<ClientPosition> {

  protected buildPosition(x: number, y: number): ClientPosition {
    return new ClientPosition(x, y)
  }

}
