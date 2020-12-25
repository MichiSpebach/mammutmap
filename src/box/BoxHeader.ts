import * as dom from '../domAdapter'
import { DragManager } from '../DragManager'
import { Rect } from '../Rect'
import { Box } from './Box'
import { DirectoryBox } from './DirectoryBox'

export abstract  class BoxHeader {
  private static readonly draggingInProgressClass: string = 'draggingInProgress'

  public readonly referenceBox: Box

  private dragOffset: {x: number, y: number} = {x:0 , y:0} // TODO: move into DragManager and let DragManager return calculated position of box (instead of pointer)

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public getId(): string {
    return this.referenceBox.getId() + 'header'
  }

  public async render(): Promise<void> {
    let html: string = '<div id="' + this.getId() + '" draggable="true">'
    html += this.referenceBox.getPath().getSrcName()
    html += '</div>'
    await dom.setContentTo(this.referenceBox.getId(), html)

    DragManager.addDraggable(this)
  }

  public async dragStart(clientX: number, clientY: number): Promise<void> {
    let clientRect: Rect = await this.referenceBox.getClientRect()
    this.dragOffset = {x: clientX - clientRect.x, y: clientY - clientRect.y}

    dom.addClassTo(this.referenceBox.getId(), BoxHeader.draggingInProgressClass)
  }

  public async drag(clientX: number, clientY: number, dropTarget: DirectoryBox): Promise<void> {
    if (this.referenceBox.getParent() != dropTarget) {
      this.referenceBox.setParentAndFlawlesslyResize(dropTarget)
    }

    const parentClientRect: Rect = await this.referenceBox.getParent().getClientRect() // TODO: cache?

    const newX = (clientX - parentClientRect.x - this.dragOffset.x) / parentClientRect.width * 100
    const newY = (clientY - parentClientRect.y - this.dragOffset.y) / parentClientRect.height * 100
    this.referenceBox.updateMeasures({x: newX, y: newY})
  }

  public async dragCancel(): Promise<void> {
    this.dragEnd() // TODO: reset position instead
  }

  public async dragEnd(): Promise<void> {
    dom.removeClassFrom(this.referenceBox.getId(), BoxHeader.draggingInProgressClass)
    this.referenceBox.saveMapData()
  }

}
