import { LocalRect } from '../LocalRect'
import { ClientRect } from '../ClientRect'
import { Box } from './Box'
import { grid } from './Grid'

export class Transform {
  private readonly referenceBox: Box

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public async localToClientRect(localRect: LocalRect): Promise<ClientRect> {
    const clientPositions: ClientPosition[] = await this.localToClientPositions([
      localRect.getTopLeftPosition(), // important that array method is called only once, would lead to branched recursion otherwise
      localRect.getBottomRightPosition()
    ])
    return ClientRect.fromPositions(clientPositions[0], clientPositions[1])
  }

  public async clientToLocalPosition(position: ClientPosition): Promise<LocalPosition> {
    const clientRect: ClientRect = await this.referenceBox.getClientRect()
    const percentX: number = (position.x - clientRect.x) / clientRect.width * 100
    const percentY: number = (position.y - clientRect.y) / clientRect.height * 100
    return new LocalPosition(percentX, percentY)
  }

  public async localToClientPosition(localPosition: LocalPosition): Promise<ClientPosition> {
    return (await this.localToClientPositions([localPosition]))[0]
  }

  public async localToClientPositions(localPositions: LocalPosition[]): Promise<ClientPosition[]> {
    const clientRect: ClientRect = await this.referenceBox.getClientRect() // important that only called once, would lead to branched recursion otherwise
    return localPositions.map(localPosition => {
      const clientX: number = clientRect.x + (localPosition.percentX/100) * clientRect.width
      const clientY: number = clientRect.y + (localPosition.percentY/100) * clientRect.height
      return new ClientPosition(clientX, clientY)
    })
  }

  public toParentPosition(position: LocalPosition): LocalPosition {
    const rect: LocalRect = this.referenceBox.getLocalRect()
    return new LocalPosition(
      rect.x + position.percentX * (rect.width/100),
      rect.y + position.percentY * (rect.height/100)
    )
  }

  public innerCoordsRecursiveToLocal(innerBox: Box, innerPosition: LocalPosition): LocalPosition {
    let tempBox: Box = innerBox
    let tempPosition: LocalPosition = innerPosition
    while (tempBox !== this.referenceBox) {
      tempPosition = tempBox.transform.toParentPosition(tempPosition)
      tempBox = tempBox.getParent() // TODO: warn if called with bad arguments?
    }
    return tempPosition
  }

  public async getNearestGridPositionOfOtherTransform(position: ClientPosition, other: Transform): Promise<LocalPosition> {
    const clientPositionSnappedToGrid: ClientPosition = await other.getNearestGridPositionInClientCoords(position)
    return this.referenceBox.transform.clientToLocalPosition(clientPositionSnappedToGrid)
  }

  public async getNearestGridPositionInClientCoords(position: ClientPosition): Promise<ClientPosition> {
    const localPosition: LocalPosition = await this.clientToLocalPosition(position)
    const localPositionSnappedToGrid: LocalPosition = this.getNearestGridPositionOf(localPosition)
    return await this.localToClientPosition(localPositionSnappedToGrid)
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

  public isBetweenCoordinateWise(line: {from: ClientPosition, to: ClientPosition}): boolean {
    const leftLineEnd: number = Math.min(line.from.x, line.to.x)
    const rightLineEnd: number = Math.max(line.from.x, line.to.x)
    const topLineEnd: number = Math.min(line.from.y, line.to.y)
    const bottomLineEnd: number = Math.max(line.from.y, line.to.y)
    return this.x >= leftLineEnd && this.x <= rightLineEnd && this.y >= topLineEnd && this.y <= bottomLineEnd
  }

  public calculateDistanceTo(other: ClientPosition): number {
    return Math.sqrt((this.x-other.x)*(this.x-other.x) + (this.y-other.y)*(this.y-other.y))
  }

  public equals(other: ClientPosition): boolean {
    return other.x === this.x && other.y === this.y
  }
}
