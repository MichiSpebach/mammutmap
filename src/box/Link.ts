import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { FolderBox } from './FolderBox'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPointData } from './WayPointData'
import { Rect } from '../Rect'

export class Link {
  private data: BoxMapLinkData
  private base: FolderBox
  private rendered: boolean = false

  public constructor(data: BoxMapLinkData, base: FolderBox) {
    this.base = base
    this.data = data
  }

  private getHeadId(): string {
    return this.data.id+'head'
  }

  public async render(): Promise<void> {
    const from: WayPointData = this.data.fromWayPoints[0]
    const to: WayPointData = this.data.toWayPoints[0]
    const fromBox: Box = this.getBox(from.boxId)
    const toBox: Box = this.getBox(to.boxId)

    const baseRect: Rect = await this.base.getClientRect() // TODO: optimize
    const fromRect: Rect = await fromBox.getClientRect() // TODO: optimize
    const toRect: Rect = await toBox.getClientRect() // TODO: optimize

    const fromXInPixel: number = from.x * fromRect.width / 100
    const fromYInPixel: number = from.y * fromRect.height / 100
    const toXInPixel: number = to.x * toRect.width / 100
    const toYInPixel: number = to.y * toRect.height / 100

    const fromBaseCoordInPixel: number[] = [fromRect.x+fromXInPixel-baseRect.x, fromRect.y+fromYInPixel-baseRect.y]
    const toBaseCoordInPixel: number[] = [toRect.x+toXInPixel-baseRect.x, toRect.y+toYInPixel-baseRect.y]

    const fromBaseCoord: number[] = [fromBaseCoordInPixel[0]/baseRect.width*100, fromBaseCoordInPixel[1]/baseRect.height*100]
    const toBaseCoord: number[] = [toBaseCoordInPixel[0]/baseRect.width*100, toBaseCoordInPixel[1]/baseRect.height*100]

    const distanceInPixel: number[] = [toBaseCoordInPixel[0]-fromBaseCoordInPixel[0], toBaseCoordInPixel[1]-fromBaseCoordInPixel[1]]
    const angleInRadians: number = Math.atan2(distanceInPixel[1], distanceInPixel[0])

    // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
    // TODO: move coordinates to svg element, svg element only as big as needed
    const lineHtml: string = '<line x1="'+fromBaseCoord[0]+'%" y1="'+fromBaseCoord[1]+'%" x2="'+toBaseCoord[0]+'%" y2="'+toBaseCoord[1]+'%" style="stroke:blue;stroke-width:2px;"/>'

    const headPositionStyle = 'position:absolute;left:'+toBaseCoord[0]+'%;top:'+toBaseCoord[1]+'%;'
    const headTriangleStyle = 'width:28px;height:10px;background:blue;clip-path:polygon(0% 0%, 55% 50%, 0% 100%);'
    const headTransformStyle = 'transform:translate(-14px, -5px)rotate('+angleInRadians+'rad);'
    const headStyle = headPositionStyle + headTriangleStyle + headTransformStyle

    if (this.rendered === false) {
      const headHtml: string = '<div id="'+this.getHeadId()+'"/>'
      await dom.addContentTo(this.base.getId(), '<svg id="'+this.data.id+'">'+lineHtml+'</svg>' + headHtml)
      this.rendered = true
    } else {
      await dom.setContentTo(this.data.id, lineHtml)
    }

    await dom.setStyleTo(this.data.id, 'position:absolute;top:0;width:100%;height:100%;pointer-events:none;')
    return dom.setStyleTo(this.getHeadId(), headStyle) // TODO: gather awaits for more performance
  }

  private getBox(boxIdFromWayPoint: string) {
    if (boxIdFromWayPoint === WayPointData.THIS_BOX_ID) {
      return this.base
    }
    return this.base.getChild(boxIdFromWayPoint)
  }

}
