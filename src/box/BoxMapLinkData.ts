import { WayPoint } from './WayPoint'

export class BoxMapLinkData {
  public readonly id: string
  public fromWayPoints: WayPoint[]
  public toWayPoints: WayPoint[]

  public constructor(id: string, fromWayPoints: WayPoint[], toWayPoints: WayPoint[]) {
    this.id = id
    this.fromWayPoints = fromWayPoints
    this.toWayPoints = toWayPoints
  }

}
