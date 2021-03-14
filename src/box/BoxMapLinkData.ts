import { WayPointData } from './WayPointData'

export class BoxMapLinkData {
  public readonly id: string
  public fromWayPoints: WayPointData[] // TODO: rename, fromWay or fromPath is better?
  public toWayPoints: WayPointData[] // TODO: rename, toWay or toPath is better?

  public constructor(id: string, fromWayPoints: WayPointData[], toWayPoints: WayPointData[]) {
    this.id = id
    this.fromWayPoints = fromWayPoints
    this.toWayPoints = toWayPoints
  }

}
