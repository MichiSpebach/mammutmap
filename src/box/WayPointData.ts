
export class WayPointData {
  public boxId: string
  public boxName: string
  public x: number
  public y: number

  public constructor(boxId: string, boxName: string, x: number, y: number) {
    this.boxId = boxId
    this.boxName = boxName
    this.x = x
    this.y = y
  }

}
