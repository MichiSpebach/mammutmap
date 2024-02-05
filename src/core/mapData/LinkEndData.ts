import { WayPointData } from './WayPointData'

export class LinkEndData {
  public path: WayPointData[]
  public floatToBorder: boolean|undefined

  public static buildFromRawObject(object: any): LinkEndData {
    const linkEndData: LinkEndData = Object.setPrototypeOf(object, LinkEndData.prototype)
    linkEndData.path = linkEndData.path.map(WayPointData.buildFromRawObject) // raw path objects would have no methods
    return linkEndData
  }

  public constructor(path: WayPointData[], floatToBorder?: boolean) {
    this.path = path
    this.floatToBorder = floatToBorder
  }

}
