import { LocalPosition } from "./Transform"

export class WayPointData {
  public boxId: string
  public boxName: string
  public x: number
  public y: number

  public static buildFromRawObject(object: any): WayPointData {
    return new WayPointData(object.boxId, object.boxName, object.x, object.y) // raw object would have no methods
  }

  public constructor(boxId: string, boxName: string, x: number, y: number) {
    this.boxId = boxId
    this.boxName = boxName
    this.x = x
    this.y = y
  }

  public getPosition(): LocalPosition {
    return new LocalPosition(this.x, this.y)
  }

}
