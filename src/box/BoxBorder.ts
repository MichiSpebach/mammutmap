import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter'
import { Box } from './Box'
import { ScaleManager } from '../ScaleManager'

export class BoxBorder {
  public readonly referenceBox: Box // TODO: use interface instead?

  private readonly topId: string
  private readonly bottomId: string
  private readonly rightId: string
  private readonly leftId: string
  private readonly sideIds: string[]

  private rendered: boolean = false

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox

    this.topId = referenceBox.getId() + 'BorderTop'
    this.bottomId = referenceBox.getId() + 'BorderBottom'
    this.rightId = referenceBox.getId() + 'BorderRight'
    this.leftId = referenceBox.getId() + 'BorderLeft'

    this.sideIds = [this.topId, this.bottomId, this.rightId, this.leftId]
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
    if(!this.rendered) {
      const top: string = this.formLine(this.getTopId(), 'width:100%;height:6px;top:0px;', 'width:100%;height:2px;top:0px;')
      const bottom: string = this.formLine(this.getBottomId(), 'width:100%;height:8px;bottom:0px;', 'width:100%;height:2px;bottom:0px;')
      const right: string = this.formLine(this.getRightId(), 'width:8px;height:100%;top:0px;right:0px;', 'width:2px;height:100%;top:0px;right:0px;')
      const left: string = this.formLine(this.getLeftId(), 'width:8px;height:100%;top:0px;', 'width:2px;height:100%;top:0px;')
      await renderManager.addContentTo(this.referenceBox.getId(), top + bottom + right + left)

      ScaleManager.addScalable(this)

      this.rendered = true
    }

    this.sideIds.forEach((sideId: string) => renderManager.removeClassFrom(sideId+'Line', style.getBoxBorderLineClass(!this.referenceBox.isMapDataFileExisting())))
    this.sideIds.forEach((sideId: string) => renderManager.addClassTo(sideId+'Line', style.getBoxBorderLineClass(this.referenceBox.isMapDataFileExisting())))
  }

  public async unrender(): Promise<void> {
    if (!this.rendered) {
      return
    }

    ScaleManager.removeScalable(this)

    const removeTop: Promise<void> = renderManager.remove(this.getTopId())
    const removeBottom: Promise<void> = renderManager.remove(this.getBottomId())
    const removeRight: Promise<void> = renderManager.remove(this.getRightId())
    const removeLeft: Promise<void> = renderManager.remove(this.getLeftId())
    await Promise.all([removeTop, removeBottom, removeRight, removeLeft])

    this.rendered = false
  }

  private formLine(id: string, sizeAndPositionStyle: string, sizeAndPositionStyleLine: string): string {
    return '<div id="'+id+'" draggable="true" style="position:absolute;'+sizeAndPositionStyle+'">'
          +'<div id="'+id+'Line" style="position:absolute;'+sizeAndPositionStyleLine+'"></div>'
          +'</div>'
  }

}
