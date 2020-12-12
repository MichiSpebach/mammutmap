import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { BoxMapData } from './BoxMapData'
import { Rect } from '../Rect'
import { ScaleManager } from '../ScaleManager'

export class BoxBorder {
  public readonly referenceBox: Box // TODO: use interface instead?

  private readonly topId: string
  private readonly bottomId: string
  private readonly rightId: string
  private readonly leftId: string

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox

    this.topId = referenceBox.getId() + 'BorderTop'
    this.bottomId = referenceBox.getId() + 'BorderBottom'
    this.rightId = referenceBox.getId() + 'BorderRight'
    this.leftId = referenceBox.getId() + 'BorderLeft'
  }

  public getTopId() {
    return this.topId
  }

  public getBottomId() {
    return this.bottomId
  }

  public getRightId() {
    return this.rightId
  }

  public getLeftId() {
    return this.leftId
  }

  public async render(): Promise<void> {
    const top: string = this.formLine(this.getTopId(), 'width:100%;height:2px;top:0px;')
    const bottom: string = this.formLine(this.getBottomId(), 'width:100%;height:2px;bottom:0px;')
    const right: string = this.formLine(this.getRightId(), 'width:2px;height:100%;top:0px;right:0px;')
    const left: string = this.formLine(this.getLeftId(), 'width:2px;height:100%;top:0px;')
    await dom.addContentTo(this.referenceBox.getId(), top + bottom + right + left)

    ScaleManager.addScalable(this)
  }

  private formLine(id: string, sizeAndPositionStyle: string): string {
    return '<div id="' + id + '" draggable="true" style="position:absolute;' + sizeAndPositionStyle + 'background-color:lightskyblue;"></div>'
  }

}
