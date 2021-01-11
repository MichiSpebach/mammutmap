import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { DirectoryBox } from './DirectoryBox'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPoint } from './WayPoint'
import { Rect } from '../Rect'

export class Link {
  private data: BoxMapLinkData
  private base: DirectoryBox

  public constructor(data: BoxMapLinkData, base: DirectoryBox) {
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

    const fromBaseCoordX: number = (fromRect.x + (from.x * fromRect.width / 100) - baseRect.x) / baseRect.width * 100
    const fromBaseCoordY: number = (fromRect.y + (from.y * fromRect.height / 100) - baseRect.y) / baseRect.height * 100
    const toBaseCoordX: number = (toRect.x + (to.x * toRect.width / 100) - baseRect.x) / baseRect.width * 100
    const toBaseCoordY: number = (toRect.y + (to.y * toRect.height / 100) - baseRect.y) / baseRect.height * 100

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
