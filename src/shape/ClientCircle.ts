import { ClientPosition } from './ClientPosition'
import { Circle } from './Circle'

export class ClientCircle extends Circle<ClientPosition> {

  protected buildPosition(x: number, y: number): ClientPosition {
    return new ClientPosition(x, y)
  }

}
