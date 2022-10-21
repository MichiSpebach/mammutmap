import { LocalPosition } from "../box/Transform"

export class WayPointData {
  public boxId: string
  public boxName: string
  public x: number
  public y: number

  public static buildNew(boxId: string, boxName: string, x: number, y: number) {
    return new WayPointData(boxId, boxName, Math.round(x*1000)/1000, Math.round(y*1000)/1000)
  }

  public static buildFromRawObject(object: any): WayPointData {
    return new WayPointData(object.boxId, object.boxName, object.x, object.y) // raw object would have no methods
  }

  private constructor(boxId: string, boxName: string, x: number, y: number) {
    this.boxId = boxId
    this.boxName = boxName
    this.x = x
    this.y = y
  }

  public getPosition(): LocalPosition {
    return new LocalPosition(this.x, this.y)
  }

}
