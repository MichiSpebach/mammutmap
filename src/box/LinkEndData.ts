import { WayPointData } from './WayPointData'

export class LinkEndData {
  public path: WayPointData[]
  public floatToBorder: boolean|undefined

  public constructor(path: WayPointData[], floatToBorder?: boolean) {
    this.path = path
    this.floatToBorder = floatToBorder
  }

}
