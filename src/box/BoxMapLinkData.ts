import { WayPointData } from './WayPointData'

export class BoxMapLinkData {
  public readonly id: string
  public fromWayPoints: WayPointData[]
  public toWayPoints: WayPointData[]

  public constructor(id: string, fromWayPoints: WayPointData[], toWayPoints: WayPointData[]) {
    this.id = id
    this.fromWayPoints = fromWayPoints
    this.toWayPoints = toWayPoints
  }

}
