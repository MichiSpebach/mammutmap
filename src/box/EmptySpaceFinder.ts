import { LocalRect } from '../LocalRect'
import { Box } from './Box'
import { Grid } from './Grid'

export class EmptySpaceFinder {
  private static freeSpaceRatio: number = 0.4

  private readonly boxes: Box[]

  public constructor(boxes: Box[]) {
    this.boxes = boxes
  }

  public findEmptySpaces(count: number): LocalRect[] {
    if (count === 1 && this.boxes.length === 0) {
      return [new LocalRect(4, 8, 92, 88)]
    }

    const columnOrRowCount: number = Math.ceil(Math.sqrt(count+this.boxes.length))
    let layer: number = 1
    let stepSize: number = Grid.getStepSizeOfLayer(layer)
    while (columnOrRowCount*2+1 >= 100/stepSize) {
      stepSize = Grid.getStepSizeOfLayer(layer)
      layer++
    }

    // TODO: remove stepSize everwhere and factor in in loop (calculate in stepSize space)
    const freeSpaceRatio: number = EmptySpaceFinder.freeSpaceRatio
    const columnCount: number = columnOrRowCount
    const rowCount: number = columnOrRowCount
    const stepsPerColumn: number = Math.floor(((100-stepSize) / columnCount) / stepSize)
    const stepsPerRow: number = Math.floor(((100-stepSize) / rowCount) / stepSize)
    const columnSize: number = stepsPerColumn*stepSize
    const rowSize: number = stepsPerRow*stepSize
    const xDistanceBetweenBoxes: number = Math.max(stepSize, Math.round(columnSize*freeSpaceRatio / stepSize) * stepSize)
    const yDistanceBetweenBoxes: number = Math.max(stepSize, Math.round(rowSize*freeSpaceRatio / stepSize) * stepSize)
    const boxSize: number = Math.min(columnSize-xDistanceBetweenBoxes, rowSize-yDistanceBetweenBoxes)
    const startX: number = Math.round((100 - columnSize*columnCount + xDistanceBetweenBoxes) / 2 / stepSize) * stepSize
    const startY: number = Math.round((100 - rowSize*rowCount + yDistanceBetweenBoxes) / 2 / stepSize) * stepSize

    const rects: LocalRect[] = []
    for (let y: number = startY; y < 100-startY; y += rowSize) {
      if (rects.length >= count) {
        break
      }
      for (let x: number = startX; x < 100-startX; x += columnSize) {
        rects.push(new LocalRect(x, y, boxSize, boxSize))
        if (rects.length >= count) {
          break
        }
      }
    }

    return rects
  }

  // TODO: use
  private isSpaceEmpty(rect: LocalRect): boolean {
    for (const box of this.boxes) {
      if (box.getLocalRect().isOverlappingWith(rect)) {
        return false
      }
    }
    return true
  }

}
