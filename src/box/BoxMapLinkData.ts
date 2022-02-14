import { BoxMapLinkPathData } from './BoxMapLinkPathData'

export class BoxMapLinkData {
  public readonly id: string
  public fromPath: BoxMapLinkPathData
  public toPath: BoxMapLinkPathData

  public static buildFromRawObject(object: any): BoxMapLinkData {
    let fromPath: BoxMapLinkPathData = object.fromPath
    let toPath: BoxMapLinkPathData = object.toPath

    // backwards compatibility, old files have wayPoints array field instead
    if (!fromPath) {
      fromPath = new BoxMapLinkPathData(object.fromWayPoints)
    }
    if (!toPath) {
      toPath = new BoxMapLinkPathData(object.toWayPoints)
    }

    return new BoxMapLinkData(object.id, fromPath, toPath)
  }

  public constructor(id: string, fromPath: BoxMapLinkPathData, toPath: BoxMapLinkPathData) {
    this.id = id
    this.fromPath = fromPath
    this.toPath = toPath
  }

}
