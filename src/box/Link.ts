import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { FolderBox } from './FolderBox'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPoint } from './WayPoint'
import { Rect } from '../Rect'

export class Link {
  private data: BoxMapLinkData
  private base: FolderBox

  public constructor(data: BoxMapLinkData, base: FolderBox) {
    this.base = base
    this.data = data
  }

  public async render(): Promise<void> {
    const from: WayPoint = this.data.fromWayPoints[0]
    const to: WayPoint = this.data.toWayPoints[0]
    const fromBox: Box = this.base.getChild(from.boxId)
    const toBox: Box = this.base.getChild(to.boxId)

    const baseRect: Rect = await this.base.getClientRect() // TODO: optimize
    const fromRect: Rect = await fromBox.getClientRect() // TODO: optimize
    const toRect: Rect = await toBox.getClientRect() // TODO: optimize

    const fromXInPixel: number = from.x * fromRect.width / 100
    const fromYInPixel: number = from.y * fromRect.height / 100
    const toXInPixel: number = to.x * toRect.width / 100
    const toYInPixel: number = to.y * toRect.height / 100

    const fromBaseCoordX: number = (fromRect.x + fromXInPixel - baseRect.x) / baseRect.width * 100
    const fromBaseCoordY: number = (fromRect.y + fromYInPixel - baseRect.y) / baseRect.height * 100
    const toBaseCoordX: number = (toRect.x + toXInPixel - baseRect.x) / baseRect.width * 100
    const toBaseCoordY: number = (toRect.y + toYInPixel - baseRect.y) / baseRect.height * 100

    // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
    // TODO: move coordinates to svg element, svg element only as big as needed
    let line: string = '<line x1="' + fromBaseCoordX +'%" y1="' + fromBaseCoordY + '%" x2="' + toBaseCoordX + '%" y2="' + toBaseCoordY + '%" style="stroke:blue;stroke-width:2px;"/>'
    await dom.addContentTo(this.base.getId(), '<svg id="' + this.data.id + '">' + line + '</svg>')

    await this.renderStyle()
  }

  public async renderStyle(): Promise<void> {
    return dom.setStyleTo(this.data.id, 'position:absolute;width:100%;height:100%;pointer-events:none;')
  }

}
