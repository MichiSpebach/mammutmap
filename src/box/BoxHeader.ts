import { renderManager, RenderPriority } from '../RenderManager'
import { Draggable } from '../Draggable'
import { DropTarget } from '../DropTarget'
import { DragManager } from '../DragManager'
import { Rect } from '../Rect'
import { Box } from './Box'
import { FolderBox } from './FolderBox'
import { ClientPosition, LocalPosition } from './Transform'

export abstract  class BoxHeader implements Draggable<FolderBox> {
  public readonly referenceBox: Box
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
    return dropTarget instanceof FolderBox
  }

  public async render(): Promise<void> {
    let html: string = '<div draggable="true">'
    html += this.referenceBox.getName()
    html += '</div>'
    await renderManager.setContentTo(this.getId(), html)

    DragManager.addDraggable(this)
  }

  public async unrender(): Promise<void> {
    DragManager.removeDraggable(this)
    await renderManager.remove(this.getId())
  }

  public async dragStart(clientX: number, clientY: number): Promise<void> {
    let clientRect: Rect = await this.referenceBox.getClientRect()
    this.dragOffset = {x: clientX - clientRect.x, y: clientY - clientRect.y}

    renderManager.addClassTo(this.referenceBox.getId(), DragManager.draggingInProgressStyleClass)
  }

  public async drag(clientX: number, clientY: number, dropTarget: FolderBox, snapToGrid: boolean): Promise<void> {
    if (!snapToGrid) {
      const parentClientRect: Rect = await this.referenceBox.getParent().getClientRect(RenderPriority.RESPONSIVE) // TODO: cache, save in state object when dragStart is called
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
