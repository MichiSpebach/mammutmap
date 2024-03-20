import { LocalRect } from '../LocalRect'
import { Grid } from './Grid'

export class EmptySpaceFinder {
  private static readonly freeSpaceRatio: number = 0.4
  private static readonly maxLayerToFollowNiceRules: number = 3

  private readonly occupiedSpaces: LocalRect[]

  public constructor(occupiedSpaces: LocalRect[]) {
    this.occupiedSpaces = occupiedSpaces
  }

  public findEmptySpaces(count: number): LocalRect[] {
    return this.findEmptySpacesWithStartLayer(count, 0)
  }

  private findEmptySpacesWithStartLayer(
    count: number,
    startLayer: number,
    occupiedSpacesMultiplier: number = 1,
    ignoreLeftAndRightMargins: boolean = false,
    ignoreExistingBoxes: boolean = false
  ): LocalRect[] {
    if (count === 1 && this.occupiedSpaces.length === 0) {
      return [new LocalRect(4, 8, 92, 88)]
    }

    const soughtElementCount: number = count + this.occupiedSpaces.length*occupiedSpacesMultiplier
    const columnOrRowCount: number = Math.ceil(Math.sqrt(soughtElementCount))
    let layer: number = startLayer-1
    let stepSize: number
    let stepCount: number
    do {
      layer++
      stepSize = Grid.getStepSizeOfLayer(layer)
      stepCount = 100/stepSize
    } while (columnOrRowCount*2+1 >= stepCount) // TODO: calculate instead of loop?

    const freeSpaceRatio: number = EmptySpaceFinder.freeSpaceRatio
    const columnCount: number = columnOrRowCount
    const rowCount: number = columnOrRowCount
    const columnSize: number = Math.floor((stepCount-1) / columnCount)
    const rowSize: number = Math.floor((stepCount-1) / rowCount)
    const xDistanceBetweenBoxes: number = Math.max(1, Math.round(columnSize*freeSpaceRatio))
    const yDistanceBetweenBoxes: number = Math.max(1, Math.round(rowSize*freeSpaceRatio))
    const boxSize: number = Math.min(columnSize-xDistanceBetweenBoxes, rowSize-yDistanceBetweenBoxes)
    let startX: number = Math.round((stepCount - columnSize*columnCount + xDistanceBetweenBoxes) / 2)
    const startY: number = Math.round((stepCount - rowSize*rowCount + yDistanceBetweenBoxes) / 2)

    if (ignoreLeftAndRightMargins) {
      startX = 1
    }

    const rects: LocalRect[] = []
    for (let y: number = startY; y <= stepCount-startY-boxSize; y += rowSize) {
      if (rects.length >= count) {
        break
      }
      for (let x: number = startX; x <= stepCount-startX-boxSize; x += columnSize) {
        const rect = new LocalRect(x*stepSize, y*stepSize, boxSize*stepSize, boxSize*stepSize)
        if (this.isSpaceEmpty(rect) || ignoreExistingBoxes) {
          rects.push(rect)
        }
        if (rects.length >= count) {
          break
        }
      }
    }

    if (rects.length < count) {
      let nextLayer = layer+1
      if (nextLayer > EmptySpaceFinder.maxLayerToFollowNiceRules && !ignoreLeftAndRightMargins) {
        nextLayer = 0
        occupiedSpacesMultiplier = 4*(nextLayer+1)
        ignoreLeftAndRightMargins = true
      } else if (nextLayer > EmptySpaceFinder.maxLayerToFollowNiceRules && !ignoreExistingBoxes) {
        nextLayer = 0
        ignoreExistingBoxes = true
      }
      return this.findEmptySpacesWithStartLayer(count, nextLayer, occupiedSpacesMultiplier, ignoreLeftAndRightMargins, ignoreExistingBoxes)
    }

    return rects
  }

  private isSpaceEmpty(rect: LocalRect): boolean {
    for (const occupiedSpace of this.occupiedSpaces) {
      if (occupiedSpace.isOverlappingWith(rect)) {
        return false
      }
    }
    return true
  }

}
