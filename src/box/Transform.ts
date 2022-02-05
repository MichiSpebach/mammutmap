import { RenderPriority } from '../RenderManager'
import { Rect } from '../Rect'
import { Box } from './Box'
import { grid } from './Grid'

export class Transform {
  private readonly referenceBox: Box

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public async clientToLocalPosition(position: ClientPosition): Promise<LocalPosition> {
    const clientRect: Rect = await this.referenceBox.getClientRect(RenderPriority.RESPONSIVE)
    const percentX: number = (position.x - clientRect.x) / clientRect.width * 100
    const percentY: number = (position.y - clientRect.y) / clientRect.height * 100
    return new LocalPosition(percentX, percentY)
  }

  public async localToClientPosition(localPosition: LocalPosition): Promise<ClientPosition> {
    const clientRect: Rect = await this.referenceBox.getClientRect(RenderPriority.RESPONSIVE)
    const clientX: number = clientRect.x + (localPosition.percentX/100) * clientRect.width
    const clientY: number = clientRect.y + (localPosition.percentY/100) * clientRect.height
    return new ClientPosition(clientX, clientY)
  }

  public async getNearestGridPositionOfOtherTransform(position: ClientPosition, other: Transform): Promise<LocalPosition> {
    const positionInDropTargetCoords: LocalPosition = await other.clientToLocalPosition(position)
    const positionInDropTargetCoordsRounded: LocalPosition = other.getNearestGridPositionOf(positionInDropTargetCoords)
    const positionInClientCoords: ClientPosition = await other.localToClientPosition(positionInDropTargetCoordsRounded)
    const localPosition: {x: number, y: number} = await this.referenceBox.transformClientPositionToLocal(positionInClientCoords.x, positionInClientCoords.y)
    return new LocalPosition(localPosition.x, localPosition.y)
  }

  // remove? not really practical
  public async getNearestGridPositionIfNearbyOrIdentidy(position: ClientPosition): Promise<LocalPosition> {
    const localPosition: LocalPosition = await this.clientToLocalPosition(position)
    const localPositionSnappedToGrid: LocalPosition = this.getNearestGridPositionOf(localPosition)
    const clientPositionSnappedToGrid: ClientPosition = await this.localToClientPosition(localPositionSnappedToGrid)

    let localX: number = localPosition.percentX
    let localY: number = localPosition.percentY
    if (Math.abs(position.x-clientPositionSnappedToGrid.x) < 25) {
      localX = localPositionSnappedToGrid.percentX
    }
    if (Math.abs(position.y-clientPositionSnappedToGrid.y) < 25) {
      localY = localPositionSnappedToGrid.percentY
    }
    return new LocalPosition(localX, localY)
  }

  public getNearestGridPositionOf(position: LocalPosition): LocalPosition {
    return new LocalPosition(this.roundToGridPosition(position.percentX), this.roundToGridPosition(position.percentY))
  }

  public roundToGridPosition(position: number): number {
    return grid.roundToGridPosition(position)
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
