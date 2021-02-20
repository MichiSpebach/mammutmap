import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { FolderBox } from './FolderBox'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPointData } from './WayPointData'
import { WayPoint } from './WayPoint'
import { Rect } from '../Rect'

export class Link {
  private data: BoxMapLinkData
  private base: FolderBox
  private head: WayPoint
  private rendered: boolean = false

  public constructor(data: BoxMapLinkData, base: FolderBox) {
    this.data = data
    this.base = base
    this.head = new WayPoint(this.getHeadId(), data.toWayPoints[0], this)
  }

  private getHeadId(): string {
    return this.data.id+'head'
  }

  public async render(): Promise<void> {
    const from: WayPointData = this.data.fromWayPoints[0]
    const to: WayPointData = this.data.toWayPoints[0]
    const toBox: Box = this.getBox(to.boxId)

    const baseRect: Rect = await this.base.getClientRect() // TODO: optimize, gather awaits for more performance
    const fromInBaseCoords: {x: number, y: number} = await this.getWayPointPositionInBaseCoords(from, baseRect) // TODO: optimize, gather awaits for more performance
    const toInBaseCoords: {x: number, y: number} = await this.getWayPointPositionInBaseCoords(to, baseRect) // TODO: optimize, gather awaits for more performance

    const distanceInPixel: number[] = [toInBaseCoords.x-fromInBaseCoords.x, toInBaseCoords.y-fromInBaseCoords.y]
    const angleInRadians: number = Math.atan2(distanceInPixel[1], distanceInPixel[0])

    // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
    // TODO: move coordinates to svg element, svg element only as big as needed?
    const linePositionHtml: string = 'x1="'+fromInBaseCoords.x+'%" y1="'+fromInBaseCoords.y+'%" x2="'+toInBaseCoords.x+'%" y2="'+toInBaseCoords.y+'%"'
    const lineHtml: string = '<line '+linePositionHtml+' style="stroke:blue;stroke-width:2px;"/>'

    if (this.rendered === false) {
      const headHtml: string = '<div id="'+this.getHeadId()+'"/>'
      await dom.addContentTo(this.base.getId(), '<svg id="'+this.data.id+'">'+lineHtml+'</svg>' + headHtml)
      this.rendered = true
    } else {
      await dom.setContentTo(this.data.id, lineHtml)
    }

    await dom.setStyleTo(this.data.id, 'position:absolute;top:0;width:100%;height:100%;pointer-events:none;')
    return this.head.render(toBox, toInBaseCoords.x, toInBaseCoords.y, angleInRadians) // TODO: gather awaits for more performance
  }

  private getBox(boxIdFromWayPoint: string) {
    if (boxIdFromWayPoint === WayPointData.THIS_BOX_ID) {
      return this.base
    }
    return this.base.getChild(boxIdFromWayPoint)
  }

  private async getWayPointPositionInBaseCoords(wayPoint: WayPointData, baseRect: Rect): Promise<{x: number; y: number} > {
    const box: Box = this.getBox(wayPoint.boxId)
    const rect: Rect = await box.getClientRect()

    const xInPixel: number = wayPoint.x * rect.width / 100
    const yInPixel: number = wayPoint.y * rect.height / 100

    const xInBaseCoordsInPixel: number = rect.x + xInPixel - baseRect.x
    const yInBaseCoordsInPixel: number = rect.y + yInPixel - baseRect.y

    return {x: xInBaseCoordsInPixel / baseRect.width * 100, y: yInBaseCoordsInPixel / baseRect.height * 100}
  }

  public async moveWayPointTo(wayPoint: WayPoint, clientX: number, clientY: number): Promise<void> {
    if (wayPoint !== this.head) {
      util.logError('Given WayPoint is not contained by Link.')
    }
    const newTo: {x: number, y: number} = await this.base.transformClientPositionToLocal(clientX, clientY)
    // TODO: wip
  }

}
