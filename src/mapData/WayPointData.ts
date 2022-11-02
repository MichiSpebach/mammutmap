import { util } from '../util'
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
    const wayPointData: WayPointData = Object.setPrototypeOf(object, WayPointData.prototype) // raw object would have no methods
    wayPointData.validate()
    return wayPointData
  }

  private constructor(boxId: string, boxName: string, x: number, y: number) {
    this.boxId = boxId
    this.boxName = boxName
    this.x = x
    this.y = y

    this.validate()
  }

  private validate(): void {
    if (!this.boxId || this.boxId.length === 0) {
      util.logWarning('WayPointData::boxId is undefined or null or has length 0.')
    }

    if (!this.boxName || this.boxName.length === 0) {
      util.logWarning('WayPointData::boxName is undefined or null or has length 0.')
    }

    if (this.x === undefined || this.x === null) {
      util.logWarning('WayPointData::x is undefined or null.')
    } else if (this.x < 0 || this.x > 100) {
      // TODO: sometimes there is a difference of epsilon, reactivate as soon as values are rounded before save
      //util.logWarning(`expected WayPointData::x to be between 0 and 100 but it is ${this.x}.`)
    }

    if (this.y === undefined || this.y === null) {
      util.logWarning('WayPointData::y is undefined or null.')
    } else if (this.y < 0 || this.y > 100) {
      // TODO: sometimes there is a difference of epsilon, reactivate as soon as values are rounded before save
      //util.logWarning(`expected WayPointData::y to be between 0 and 100 but it is ${this.y}.`)
    }
  }

  public getPosition(): LocalPosition {
    return new LocalPosition(this.x, this.y)
  }

}
