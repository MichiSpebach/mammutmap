import { LinkEndData } from './LinkEndData'

export class BoxMapLinkData {
  public readonly id: string
  public from: LinkEndData
  public to: LinkEndData

  public static buildFromRawObject(object: any): BoxMapLinkData {
    let from: LinkEndData = object.from
    let to: LinkEndData = object.to

    // backwards compatibility, old files have wayPoints array field instead
    if (!from) {
      from = new LinkEndData(object.fromWayPoints)
    }
    if (!to) {
      to = new LinkEndData(object.toWayPoints)
    }

    return new BoxMapLinkData(object.id, from, to)
  }

  public constructor(id: string, from: LinkEndData, to: LinkEndData) {
    this.id = id
    this.from = from
    this.to = to
  }

}
