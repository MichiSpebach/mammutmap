import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import { Box } from './Box'
import { ScaleManager } from '../ScaleManager'
import * as indexHtmlIds from '../indexHtmlIds'
import { util } from '../util'

export class ScaleTool {
  private readonly id: string = 'scaleTool'
  private readonly sideIds: string[]
  private readonly sideLineIds: string[]
  private idRenderedInto: string|null = null
  private boxRenderedInto: Box|null = null // TODO: use Scalable interface instead?

  public constructor() {
    this.sideIds = [this.getTopId(), this.getBottomId(), this.getRightId(), this.getLeftId(), this.getRightBottomId()]
    this.sideLineIds = [this.getTopId()+'Line', this.getBottomId()+'Line', this.getRightId()+'Line', this.getLeftId()+'Line', this.getRightBottomId()]
  }

  public getTopId() {
    return this.id+'Top'
  }

  public getBottomId() {
    return this.id+'Bottom'
  }

  public getRightId() {
    return this.id+'Right'
  }

  public getLeftId() {
    return this.id+'Left'
  }

  public getRightBottomId() {
    return this.id+'RightBottom'
  }

  public isScalingInProgress(): boolean {
    return ScaleManager.isScalingInProgress()
  }

  public getBoxRenderedIntoOrFail(): Box|never {
    if (!this.boxRenderedInto) {
      util.logError('ScaleTool can not get boxRenderedInto because it is not set at this state.')
    }
    return this.boxRenderedInto
  }

  public async renderInto(box: Box): Promise<void> {
    if (!this.idRenderedInto) {
      this.idRenderedInto = box.getScaleToolPlaceHolderId()
      this.boxRenderedInto = box
      const top: string = this.formLine(this.getTopId(), 'width:100%;height:6px;top:0px;', 'width:100%;height:2px;top:0px;')
      const bottom: string = this.formLine(this.getBottomId(), 'width:100%;height:8px;bottom:0px;', 'width:100%;height:2px;bottom:0px;')
      const right: string = this.formLine(this.getRightId(), 'width:8px;height:100%;top:0px;right:0px;', 'width:2px;height:100%;top:0px;right:0px;')
      const left: string = this.formLine(this.getLeftId(), 'width:8px;height:100%;top:0px;', 'width:2px;height:100%;top:0px;')
      const rightBottom: string = this.formEdge(this.getRightBottomId(), 'width:8px;height:8px;right:0px;bottom:0px;clip-path:polygon(0% 100%, 100% 0%, 100% 100%);')
      await renderManager.setContentTo(this.idRenderedInto, '<div id="'+this.id+'">'+top+bottom+right+left+rightBottom+'</div>', RenderPriority.RESPONSIVE)
      ScaleManager.addScalable(this)
    } else if (this.boxRenderedInto !== box) {
      this.idRenderedInto = box.getScaleToolPlaceHolderId()
      this.boxRenderedInto = box
      await renderManager.appendChildTo(this.idRenderedInto, this.id, RenderPriority.RESPONSIVE)
    }
  }

  public async unrenderFrom(box: Box): Promise<void> {
    if (this.boxRenderedInto !== box) {
      return
    }
    this.idRenderedInto = indexHtmlIds.unplacedElementsId
    this.boxRenderedInto = null
    await renderManager.appendChildTo(this.idRenderedInto, this.id, RenderPriority.RESPONSIVE)
  }

  private formLine(id: string, sizeAndPositionStyle: string, sizeAndPositionStyleLine: string): string {
    return '<div id="'+id+'" draggable="true" style="position:absolute;'+sizeAndPositionStyle+'">'
          +'<div id="'+id+'Line" class="'+style.getHighlightClass()+'" style="position:absolute;'+sizeAndPositionStyleLine+'"></div>'
          +'</div>'
  }

  private formEdge(id: string, sizeAndPositionStyle: string): string {
    return '<div id="'+id+'" draggable="true" class="'+style.getHighlightClass()+'" style="position:absolute;'+sizeAndPositionStyle+'"></div>'
  }

  public async scaleStart(): Promise<void> {
    if (!this.boxRenderedInto) {
      util.logWarning('scaleStart is called altough ScaleTool is not rendered into a box => cannot start scaling.')
      return
    }
    await this.boxRenderedInto.getParent().attachGrid(RenderPriority.RESPONSIVE)
  }

  public async scaleEnd(): Promise<void> {
    if (!this.boxRenderedInto) {
      util.logWarning('scaleEnd is called altough ScaleTool is not rendered into a box => cannot end scaling.')
      return
    }
    const proms: Promise<any>[] = []
    proms.push(this.boxRenderedInto.getParent().detachGrid(RenderPriority.RESPONSIVE))
    proms.push(this.boxRenderedInto.saveMapData())
    await Promise.all(proms)
  }

}

export const scaleTool = new ScaleTool()