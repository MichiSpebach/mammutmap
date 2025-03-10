import { LinkEndData } from './LinkEndData'

export class LinkData {
  public readonly id: string
  public from: LinkEndData
  public to: LinkEndData
  public routes: string[]|undefined
  public tags: string[]|undefined

  public static buildFromRawObject(object: any): LinkData {
    const linkData: LinkData = Object.setPrototypeOf(object, LinkData.prototype)

    if (linkData.from) {
      linkData.from = LinkEndData.buildFromRawObject(linkData.from) // raw object would have no methods
    } else {
      // backwards compatibility, old files have wayPoints array field instead
      linkData.from = LinkEndData.buildFromRawObject(new LinkEndData(object.fromWayPoints))
    }

    if (linkData.to) {
      linkData.to = LinkEndData.buildFromRawObject(linkData.to) // raw object would have no methods
    } else {
      // backwards compatibility, old files have wayPoints array field instead
      linkData.to = LinkEndData.buildFromRawObject(new LinkEndData(object.toWayPoints))
    }

    return linkData
  }

  public constructor(id: string, from: LinkEndData, to: LinkEndData, routes?: string[], tags?: string[]) {
    this.id = id
    this.from = from
    this.to = to
    this.routes = routes
    this.tags = tags
  }

}
