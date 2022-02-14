import { WayPointData } from './WayPointData'

export class BoxMapLinkPathData {
  public wayPoints: WayPointData[]

  public constructor(wayPoints: WayPointData[]) {
    this.wayPoints = wayPoints
  }

}
