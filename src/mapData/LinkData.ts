import { LinkEndData } from '../box/LinkEndData'

export class LinkData {
  public readonly id: string
  public from: LinkEndData
  public to: LinkEndData
  public tags: string[]|undefined

  public static buildFromRawObject(object: any): LinkData {
    let from: LinkEndData
    let to: LinkEndData

    if (object.from) {
      from = LinkEndData.buildFromRawObject(object.from) // raw object would have no methods
    } else {
      // backwards compatibility, old files have wayPoints array field instead
      from = LinkEndData.buildFromRawObject(new LinkEndData(object.fromWayPoints)) // raw object would have no methods
    }

    if (object.to) {
      to = LinkEndData.buildFromRawObject(object.to) // raw object would have no methods
    } else {
      // backwards compatibility, old files have wayPoints array field instead
      to = LinkEndData.buildFromRawObject(new LinkEndData(object.toWayPoints)) // raw object would have no methods
    }

    return new LinkData(object.id, from, to, object.tags)
  }

  public constructor(id: string, from: LinkEndData, to: LinkEndData, tags?: string[]) {
    this.id = id
    this.from = from
    this.to = to
    this.tags = tags
  }

}
