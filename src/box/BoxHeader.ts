import { renderManager, RenderPriority } from '../RenderManager'
import { Draggable } from '../Draggable'
import { DropTarget } from '../DropTarget'
import { DragManager } from '../DragManager'
import { ClientRect } from '../ClientRect'
import { Box } from './Box'
import { FolderBox } from './FolderBox'
import { ClientPosition, LocalPosition } from './Transform'
import { style } from '../styleAdapter'
import { settings } from '../Settings'

export abstract  class BoxHeader implements Draggable<FolderBox> {
  public readonly referenceBox: Box
  private rendered: boolean = false
  private dragOffset: {x: number, y: number} = {x:0 , y:0} // TODO: move into DragManager and let DragManager return calculated position of box (instead of pointer)

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public getId(): string {
    return this.referenceBox.getId()+'Header'
  }

  public getDropTargetAtDragStart(): FolderBox {
    return this.referenceBox.getParent()
  }

  public canBeDroppedInto(dropTarget: DropTarget): boolean {
    return settings.getBoxesDraggableIntoOtherBoxes() && dropTarget instanceof FolderBox
  }

  public async render(): Promise<void> {
    let html: string = '<div draggable="true" class="'+style.getBoxHeaderInnerClass()+'">'
    html += this.referenceBox.getName()
    html += '</div>'
    await renderManager.setContentTo(this.getId(), html)

    if (!this.rendered) {
      renderManager.addClassTo(this.getId(), style.getBoxHeaderClass())
      DragManager.addDraggable(this)
      this.rendered = true
    }
  }

  public async unrender(): Promise<void> {
    if (!this.rendered) {
      return
    }
    DragManager.removeDraggable(this)
    await renderManager.remove(this.getId())
    this.rendered = false
  }

  public async dragStart(clientX: number, clientY: number): Promise<void> {
    let clientRect: ClientRect = await this.referenceBox.getClientRect()
    this.dragOffset = {x: clientX - clientRect.x, y: clientY - clientRect.y}

    renderManager.addClassTo(this.referenceBox.getId(), DragManager.draggingInProgressStyleClass)
  }

  public async drag(clientX: number, clientY: number, dropTarget: FolderBox, snapToGrid: boolean): Promise<void> {
    if (!snapToGrid) {
      const parentClientRect: ClientRect = await this.referenceBox.getParent().getClientRect()
      const newX = (clientX - parentClientRect.x - this.dragOffset.x) / parentClientRect.width * 100
      const newY = (clientY - parentClientRect.y - this.dragOffset.y) / parentClientRect.height * 100
      this.referenceBox.updateMeasuresAndBorderingLinks({x: newX, y: newY}, RenderPriority.RESPONSIVE)
    } else {
      const clientPosition = new ClientPosition(clientX-this.dragOffset.x, clientY-this.dragOffset.y)
      const positionInParentBoxCoords: LocalPosition = await this.referenceBox.getParent().transform.getNearestGridPositionOfOtherTransform(clientPosition, dropTarget.transform)
      this.referenceBox.updateMeasuresAndBorderingLinks({x: positionInParentBoxCoords.percentX, y: positionInParentBoxCoords.percentY})
    }
  }

  public async dragCancel(): Promise<void> {
    renderManager.removeClassFrom(this.referenceBox.getId(), DragManager.draggingInProgressStyleClass)
    this.referenceBox.restoreMapData()
  }

  public async dragEnd(dropTarget: FolderBox): Promise<void> {
    renderManager.removeClassFrom(this.referenceBox.getId(), DragManager.draggingInProgressStyleClass)
    if (this.referenceBox.getParent() != dropTarget) {
      await this.referenceBox.setParentAndFlawlesslyResizeAndSave(dropTarget)
    } else {
      await this.referenceBox.saveMapData()
    }
  }

}
