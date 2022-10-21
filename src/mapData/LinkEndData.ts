import { WayPointData } from '../box/WayPointData'

export class LinkEndData {
  public path: WayPointData[]
  public floatToBorder: boolean|undefined

  public static buildFromRawObject(object: any): LinkEndData {
    const path: WayPointData[] = object.path.map(WayPointData.buildFromRawObject) // raw path objects would have no methods
    return new LinkEndData(path, object.floatToBorder)
  }

  public constructor(path: WayPointData[], floatToBorder?: boolean) {
    this.path = path
    this.floatToBorder = floatToBorder
  }

}
