import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import { Box } from './Box'
import { ScaleManager } from '../ScaleManager'
import * as indexHtmlIds from '../indexHtmlIds'
import { util } from '../util/util'
import { ClientRect } from '../ClientRect'

export class ScaleTool {
  private readonly id: string = 'scaleTool'
  private idRenderedInto: string|null = null
  private boxRenderedInto: Box|null = null // TODO: use Scalable interface instead?

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

  private getBoxRenderedIntoOrFail(): Box|never {
    if (!this.boxRenderedInto) {
      util.logError('ScaleTool can not get boxRenderedInto because it is not set at this state.')
    }
    return this.boxRenderedInto
  }

  public async renderInto(box: Box): Promise<void> {
    if (!this.idRenderedInto) {
      this.idRenderedInto = box.getScaleToolPlaceHolderId()
      this.boxRenderedInto = box
      const top: string = this.formLine(this.getTopId(), 'width:100%;height:8px;top:-4px;', 'width:100%;height:2px;top:4px;')
      const bottom: string = this.formLine(this.getBottomId(), 'width:100%;height:8px;bottom:-4px;', 'width:100%;height:2px;bottom:4px;')
      const right: string = this.formLine(this.getRightId(), 'width:8px;height:100%;right:-4px;', 'width:2px;height:100%;right:4px;')
      const left: string = this.formLine(this.getLeftId(), 'width:8px;height:100%;left:-4px;', 'width:2px;height:100%;left:4px;')
      const rightBottom: string = this.formLine(this.getRightBottomId(), 'width:13px;height:13px;right:-4px;bottom:-4px;', 'width:8px;height:8px;clip-path:polygon(0% 100%, 100% 0%, 100% 100%);')
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
    return '<div id="'+id+'" style="position:absolute;'+sizeAndPositionStyle+'">'
          +'<div id="'+id+'Line" class="'+style.getHighlightClass()+'" style="position:absolute;'+sizeAndPositionStyleLine+'"></div>'
          +'</div>'
  }

  public async getClientRect(): Promise<ClientRect> {
    return this.getBoxRenderedIntoOrFail().getClientRect()
  }

  public async getParentClientRect(): Promise<ClientRect> {
    return this.getBoxRenderedIntoOrFail().getParentClientRect()
  }

  public roundToParentGridPositionX(localPositionX: number): number {
    const boxRenderedInto: Box = this.getBoxRenderedIntoOrFail()
    if (boxRenderedInto.isRoot()) {
      return boxRenderedInto.transform.roundToGridPositionX(localPositionX)
    }
    return boxRenderedInto.getParent().transform.roundToGridPositionX(localPositionX)
  }

  public roundToParentGridPositionY(localPositionY: number): number {
    const boxRenderedInto: Box = this.getBoxRenderedIntoOrFail()
    if (boxRenderedInto.isRoot()) {
      return boxRenderedInto.transform.roundToGridPositionY(localPositionY)
    }
    return boxRenderedInto.getParent().transform.roundToGridPositionY(localPositionY)
  }

  public async scaleStart(): Promise<void> {
    if (!this.boxRenderedInto) {
      util.logWarning('scaleStart is called altough ScaleTool is not rendered into a box => cannot start scaling.')
      return
    }
    if (!this.boxRenderedInto.isRoot()) {
      await this.boxRenderedInto.getParent().raster.attachGrid(RenderPriority.RESPONSIVE)
    }
  }

  public async scale(measuresInPercentIfChanged: {x?: number, y?: number, width?: number, height?: number}): Promise<void> {
    const boxRenderedInto: Box = this.getBoxRenderedIntoOrFail()
    await boxRenderedInto.updateMeasuresAndBorderingLinks(measuresInPercentIfChanged, RenderPriority.RESPONSIVE)
    if (!boxRenderedInto.isRoot()) {
      await boxRenderedInto.getParent().rearrangeBoxesWithoutMapData(boxRenderedInto)
    }
  }

  public async scaleEnd(): Promise<void> {
    if (!this.boxRenderedInto) {
      util.logWarning('scaleEnd is called altough ScaleTool is not rendered into a box => cannot end scaling.')
      return
    }
    const proms: Promise<any>[] = []
    if (!this.boxRenderedInto.isRoot()) {
      proms.push(this.boxRenderedInto.getParent().raster.detachGrid(RenderPriority.RESPONSIVE))
    }
    proms.push(this.boxRenderedInto.saveMapData())
    await Promise.all(proms)
  }

}

export const scaleTool = new ScaleTool()
