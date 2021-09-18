import * as util from '../util'
import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter'
import { Rect } from '../Rect'
import { Draggable } from '../Draggable'
import { DropTarget } from '../DropTarget'
import { DragManager } from '../DragManager'
import { Box } from './Box'
import { Link } from './Link'

export class LinkEnd implements Draggable<Box> {
  private readonly id: string
  private readonly referenceLink: Link
  private shape: 'square'|'arrow'
  private rendered: boolean = false
  private borderingBox: Box|null = null
  private recentDragPosition: {x: number, y: number}|null = null

  public constructor(id: string, referenceLink: Link, shape: 'square'|'arrow') {
    this.id = id
    this.referenceLink = referenceLink
    this.shape = shape
  }

  public getId(): string {
    return this.id
  }

  public getBorderingBox(): Box|never {
    if (!this.borderingBox) {
      util.logError('WayPoint must be rendered before calling getBorderingBox(), but was not.')
    }
    return this.borderingBox
  }

  public getDropTargetAtDragStart(): Box|never {
    return this.getBorderingBox()
  }

  public canBeDroppedInto(dropTarget: DropTarget): boolean {
    return dropTarget instanceof Box
  }

  public dragStart(clientX: number, clientY: number): Promise<void> {
    this.recentDragPosition = {x: clientX, y: clientY}
    return this.referenceLink.renderLinkEndAtPosition(this, clientX, clientY)
  }

  public drag(clientX: number, clientY: number): Promise<void> {
    this.recentDragPosition = {x: clientX, y: clientY}
    return this.referenceLink.renderLinkEndAtPosition(this, clientX, clientY)
  }

  public dragCancel(): Promise<void> {
    this.recentDragPosition = null
    return this.referenceLink.render()
  }

  public async dragEnd(dropTarget: Box): Promise<void> {
    if (this.recentDragPosition === null) {
      util.logError('recentDragPosition is null')
    }

    await this.referenceLink.renderLinkEndInDropTargetAndSave(this, dropTarget)

    this.recentDragPosition = null
  }

  public async render(borderingBox: Box, x: number, y: number, angleInRadians: number): Promise<void> {
    this.borderingBox = borderingBox

    await this.renderShape(x, y, angleInRadians)

    if (!this.rendered) {
      DragManager.addDraggable(this)
      this.rendered = true
    }
  }

  public async unrender(): Promise<void> {
    if (!this.rendered) {
      return
    }

    DragManager.removeDraggable(this)
    await renderManager.setStyleTo(this.getId(), '')

    this.rendered = false
  }

  private async renderShape(x: number, y: number, angleInRadians: number): Promise<void> {
    const positionStyle = 'position:absolute;left:'+x+'%;top:'+y+'%;'
    let shapeStyle: string
    let transformStyle: string

    switch (this.shape) {
      case 'square':
        shapeStyle = 'width:10px;height:10px;background-color:'+style.getLinkColor()+';'
        transformStyle = 'transform:translate(-5px,-5px);'
        break
      case 'arrow':
        shapeStyle = 'width:28px;height:10px;background-color:'+style.getLinkColor()+';clip-path:polygon(0% 0%, 55% 50%, 0% 100%);'
        transformStyle = 'transform:translate(-14px,-5px)rotate('+angleInRadians+'rad);'
        break
      default:
        shapeStyle = ''
        transformStyle = ''
        util.logWarning('Shape '+this.shape+' is not implemented.')
    }

    await renderManager.setStyleTo(this.getId(), positionStyle + shapeStyle + transformStyle)
  }

  public async setHighlight(highlight: boolean): Promise<void> {
    if (!this.rendered) {
      util.logWarning('setHighlight(..) called although LinkEnd '+this.getId()+' is not rendered yet.')
    }

    if (highlight) {
      await renderManager.addClassTo(this.getId(), style.getHighlightClass())
    } else {
      await renderManager.removeClassFrom(this.getId(), style.getHighlightClass())
    }
  }

  public async getClientMidPosition(): Promise<{x: number, y: number}> {
    const clientRect: Rect = await renderManager.getClientRectOf(this.getId())
    return {x: clientRect.x + clientRect.width/2, y: clientRect.y + clientRect.height/2}
  }

}
