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
  private fromWayPoint: WayPoint
  private toWayPoint: WayPoint
  private rendered: boolean = false

  public constructor(data: BoxMapLinkData, base: FolderBox) {
    this.data = data
    this.base = base
    this.fromWayPoint = new WayPoint(this.data.id+'from', data.fromWayPoints[0], this, 'none')
    this.toWayPoint = new WayPoint(this.data.id+'to', data.toWayPoints[0], this, 'arrow')
  }

  public async render(): Promise<void> {
    const from: WayPointData = this.data.fromWayPoints[0]
    const to: WayPointData = this.data.toWayPoints[0]

    const baseRect: Rect = await this.base.getClientRect() // TODO: optimize, gather awaits for more performance
    const fromInBaseCoords: {x: number, y: number} = await this.getWayPointPositionInBaseCoords(from, baseRect) // TODO: optimize, gather awaits for more performance
    const toInBaseCoords: {x: number, y: number} = await this.getWayPointPositionInBaseCoords(to, baseRect) // TODO: optimize, gather awaits for more performance

    return this.renderAtPosition(fromInBaseCoords, toInBaseCoords)
  }

  public async renderWayPointAtPosition(wayPoint: WayPoint, clientX: number, clientY: number): Promise<void> {
    if (wayPoint !== this.toWayPoint) {
      util.logError('Given WayPoint is not contained by Link.')
    }

    const from: WayPointData = this.data.fromWayPoints[0]
    const baseRect: Rect = await this.base.getClientRect() // TODO: optimize, use cached?
    const fromInBaseCoords: {x: number, y: number} = await this.getWayPointPositionInBaseCoords(from, baseRect)
    const newToInBaseCoords: {x: number, y: number} = await this.base.transformClientPositionToLocal(clientX, clientY)

    await this.renderAtPosition(fromInBaseCoords, newToInBaseCoords)
  }

  public async renderWayPointAtPositionAndSave(wayPoint: WayPoint, clientX: number, clientY: number, dropTarget: Box): Promise<void> {
    if (wayPoint !== this.toWayPoint) {
      util.logError('Given WayPoint is not contained by Link.')
    }

    const to: WayPointData = this.data.toWayPoints[0]
    to.boxId = dropTarget.getId()

    //if (!this.base.containsBox(dropTarget)) {
    //  this.reorder() // TODO: wip
    //}

    const newPositionInDropTargetCoords: {x: number, y: number} = await dropTarget.transformClientPositionToLocal(clientX, clientY)

    to.x = newPositionInDropTargetCoords.x
    to.y = newPositionInDropTargetCoords.y

    await this.render()
    await this.base.saveMapData()
  }

  private async renderAtPosition(fromInBaseCoords: {x: number, y: number}, toInBaseCoords: {x: number, y: number}): Promise<void> {
    const distanceInPixel: number[] = [toInBaseCoords.x-fromInBaseCoords.x, toInBaseCoords.y-fromInBaseCoords.y]
    const angleInRadians: number = Math.atan2(distanceInPixel[1], distanceInPixel[0])

    // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
    // TODO: move coordinates to svg element, svg element only as big as needed?
    const linePositionHtml: string = 'x1="'+fromInBaseCoords.x+'%" y1="'+fromInBaseCoords.y+'%" x2="'+toInBaseCoords.x+'%" y2="'+toInBaseCoords.y+'%"'
    const lineHtml: string = '<line '+linePositionHtml+' style="stroke:blue;stroke-width:2px;"/>'

    if (this.rendered === false) {
      const fromWayPointHtml: string = '<div id="'+this.fromWayPoint.getId()+'" draggable="true"/>'
      const toWayPointHtml: string = '<div id="'+this.toWayPoint.getId()+'" draggable="true"/>'
      await dom.addContentTo(this.base.getId(), '<svg id="'+this.data.id+'">'+lineHtml+'</svg>'+fromWayPointHtml+toWayPointHtml)
      this.rendered = true
    } else {
      await dom.setContentTo(this.data.id, lineHtml)
    }

    await dom.setStyleTo(this.data.id, 'position:absolute;top:0;width:100%;height:100%;pointer-events:none;')
    const fromBox: Box = this.getBox(this.fromWayPoint.getData().boxId)
    await this.fromWayPoint.render(fromBox, toInBaseCoords.x, toInBaseCoords.y, angleInRadians)
    const toBox: Box = this.getBox(this.toWayPoint.getData().boxId)
    await this.toWayPoint.render(toBox, toInBaseCoords.x, toInBaseCoords.y, angleInRadians) // TODO: gather awaits for more performance
  }

  private async getWayPointPositionInBaseCoords(wayPoint: WayPointData, baseRect: Rect): Promise<{x: number; y: number}> {
    const box: Box = this.getBox(wayPoint.boxId)
    const rect: Rect = await box.getClientRect()

    const xInPixel: number = wayPoint.x * rect.width / 100
    const yInPixel: number = wayPoint.y * rect.height / 100

    const xInBaseCoordsInPixel: number = rect.x + xInPixel - baseRect.x
    const yInBaseCoordsInPixel: number = rect.y + yInPixel - baseRect.y

    return {x: xInBaseCoordsInPixel / baseRect.width * 100, y: yInBaseCoordsInPixel / baseRect.height * 100}
  }

  private getBox(boxIdFromWayPoint: string) {
    if (boxIdFromWayPoint === WayPointData.THIS_BOX_ID) {
      return this.base
    }
    return this.base.getChild(boxIdFromWayPoint)
  }

  private reorder_restructure_rebalance(): void {

  }

}
