import { RenderPriority } from '../RenderManager'
import { Rect } from '../Rect'
import { Box } from './Box'

export class Transform {
  private readonly referenceBox: Box

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public async localToClientPosition(localPosition: LocalPosition): Promise<ClientPosition> {
    const clientRect: Rect = await this.referenceBox.getClientRect(RenderPriority.RESPONSIVE)
    const clientX: number = clientRect.x + (localPosition.percentX/100) * clientRect.width
    const clientY: number = clientRect.y + (localPosition.percentY/100) * clientRect.height
    return new ClientPosition(clientX, clientY)
  }

  public async getNearestGridPositionOfOtherTransform(position: ClientPosition, other: Transform): Promise<LocalPosition> {
    const positionInDropTargetCoords: {x: number, y: number} = await other.referenceBox.transformClientPositionToLocal(position.x, position.y)
    const positionInDropTargetCoordsRounded: LocalPosition = other.getNearestGridPositionOf(new LocalPosition(positionInDropTargetCoords.x, positionInDropTargetCoords.y))
    const positionInClientCoords: ClientPosition = await other.localToClientPosition(positionInDropTargetCoordsRounded)
    const localPosition: {x: number, y: number} = await this.referenceBox.transformClientPositionToLocal(positionInClientCoords.x, positionInClientCoords.y)
    return new LocalPosition(localPosition.x, localPosition.y)
  }

  public getNearestGridPositionOf(position: LocalPosition): LocalPosition {
    return new LocalPosition(this.roundToGridPosition(position.percentX), this.roundToGridPosition(position.percentY))
  }

  private roundToGridPosition(position: number): number {
    return Math.round(position/4) * 4
  }

}

export class LocalPosition {
  public readonly percentX: number
  public readonly percentY: number

  public constructor(percentX: number, percentY: number) {
    this.percentX = percentX
    this.percentY = percentY
  }
}

export class ClientPosition {
  public readonly x: number
  public readonly y: number

  public constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
}
