import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import { Box } from './Box'
import { ScaleManager } from '../ScaleManager'

export class BoxBorder {
  public readonly referenceBox: Box // TODO: use interface instead?
  private readonly sideIds: string[]
  private readonly sideLineIds: string[]
  private rendered: boolean = false

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
    this.sideIds = [this.getTopId(), this.getBottomId(), this.getRightId(), this.getLeftId(), this.getRightBottomId()]
    this.sideLineIds = [this.getTopId()+'Line', this.getBottomId()+'Line', this.getRightId()+'Line', this.getLeftId()+'Line', this.getRightBottomId()]
  }

  public getId(): string {
    return this.referenceBox.getId()+'Border'
  }

  public getTopId() {
    return this.getId()+'Top'
  }

  public getBottomId() {
    return this.getId()+'Bottom'
  }

  public getRightId() {
    return this.getId()+'Right'
  }

  public getLeftId() {
    return this.getId()+'Left'
  }

  public getRightBottomId() {
    return this.getId()+'RightBottom'
  }

  public async render(): Promise<void> {
    if(!this.rendered) {
      const top: string = this.formLine(this.getTopId(), 'width:100%;height:6px;top:0px;', 'width:100%;height:2px;top:0px;')
      const bottom: string = this.formLine(this.getBottomId(), 'width:100%;height:8px;bottom:0px;', 'width:100%;height:2px;bottom:0px;')
      const right: string = this.formLine(this.getRightId(), 'width:8px;height:100%;top:0px;right:0px;', 'width:2px;height:100%;top:0px;right:0px;')
      const left: string = this.formLine(this.getLeftId(), 'width:8px;height:100%;top:0px;', 'width:2px;height:100%;top:0px;')
      const rightBottom: string = this.formEdge(this.getRightBottomId(), 'width:8px;height:8px;right:0px;bottom:0px;clip-path:polygon(0% 100%, 100% 0%, 100% 100%);')
      await renderManager.setContentTo(this.getId(), top+bottom+right+left+rightBottom)

      ScaleManager.addScalable(this)

      this.rendered = true
    }

    this.sideLineIds.forEach((id: string) => renderManager.removeClassFrom(id, style.getBoxBorderLineClass(!this.referenceBox.isMapDataFileExisting())))
    this.sideLineIds.forEach((id: string) => renderManager.addClassTo(id, style.getBoxBorderLineClass(this.referenceBox.isMapDataFileExisting())))
  }

  public async unrender(): Promise<void> {
    if (!this.rendered) {
      return
    }

    ScaleManager.removeScalable(this)

    const proms: Promise<void>[] = []
    for (const sideId of this.sideIds) {
      proms.push(renderManager.remove(sideId))
    }
    await Promise.all(proms)

    this.rendered = false
  }

  private formLine(id: string, sizeAndPositionStyle: string, sizeAndPositionStyleLine: string): string {
    return '<div id="'+id+'" draggable="true" style="position:absolute;'+sizeAndPositionStyle+'">'
          +'<div id="'+id+'Line" class="'+style.getHighlightTransitionClass()+'" style="position:absolute;'+sizeAndPositionStyleLine+'"></div>'
          +'</div>'
  }

  private formEdge(id: string, sizeAndPositionStyle: string): string {
    return '<div id="'+id+'" draggable="true" class="'+style.getHighlightTransitionClass()+'" style="position:absolute;'+sizeAndPositionStyle+'"></div>'
  }

  public async scaleStart(): Promise<void> {
    await this.referenceBox.getParent().attachGrid(RenderPriority.RESPONSIVE)
  }

  public async scaleEnd(): Promise<void> {
    const proms: Promise<any>[] = []
    proms.push(this.referenceBox.getParent().detachGrid(RenderPriority.RESPONSIVE))
    proms.push(this.referenceBox.saveMapData())
    await Promise.all(proms)
  }

  public async setHighlight(highlight: boolean): Promise<void> {
    if (highlight) {
      await Promise.all(this.sideLineIds.map(id => renderManager.addClassTo(id, style.getHighlightClass())))
    } else {
      await Promise.all(this.sideLineIds.map(id => renderManager.removeClassFrom(id, style.getHighlightClass())))
    }
  }

}
