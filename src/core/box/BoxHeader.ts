import { renderManager, RenderPriority } from '../RenderManager'
import { Draggable } from '../Draggable'
import { DropTarget } from '../DropTarget'
import { DragManager } from '../DragManager'
import { ClientRect } from '../ClientRect'
import { Box } from './Box'
import { FolderBox } from './FolderBox'
import { ClientPosition } from '../shape/ClientPosition'
import { LocalPosition } from '../shape/LocalPosition'
import { style } from '../styleAdapter'
import { settings } from '../Settings'
import { util } from '../util/util'

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

  public getManagingBox(): Box {
    return this.referenceBox.getParent()
  }

  public getDropTargetAtDragStart(): FolderBox {
    if (this.referenceBox.isRoot()) {
      return this.referenceBox as FolderBox // in order that RootFolderBox can be dragged
    }
    return this.referenceBox.getParent()
  }

  public canBeDroppedInto(dropTarget: DropTarget): boolean {
    return settings.getBoolean('boxesDraggableIntoOtherBoxes') && dropTarget instanceof FolderBox
  }

  public async render(): Promise<void> {
    const proms: Promise<any>[] = []

    let draggableHtml: string = 'draggable="true"'
    if (this.referenceBox.isRoot()) {
      draggableHtml = ''
    }

    let html: string = `<div ${draggableHtml} class="${style.getBoxHeaderInnerClass()}">`
    html += this.formTitleHtml()
    html += '</div>'
    proms.push(renderManager.setContentTo(this.getId(), html))

    if (!this.rendered) {
      proms.push(renderManager.addClassTo(this.getId(), style.getBoxHeaderClass()))
      if (draggableHtml) {
        proms.push(DragManager.addDraggable(this))
      }
      this.rendered = true
    }

    await Promise.all(proms)
  }

  public formTitleHtml(): string {
    return this.referenceBox.getName()
  }

  public async unrender(): Promise<void> {
    if (!this.rendered) {
      return
    }
    if (!this.referenceBox.isRoot()) {
      await DragManager.removeDraggable(this)
    }
    this.rendered = false // TODO: implement rerenderAfter(Un)RenderFinished mechanism?
  }

  public async dragStart(clientX: number, clientY: number): Promise<void> {
    if (this.referenceBox.site.isDetached()) {
      util.logWarning(`BoxHeader::dragStart(..) called on detached box "${this.referenceBox.getName()}".`)
    }

    let clientRect: ClientRect = await this.referenceBox.getClientRect()
    this.dragOffset = {x: clientX - clientRect.x, y: clientY - clientRect.y}

    await renderManager.addClassTo(this.referenceBox.getId(), DragManager.draggingInProgressStyleClass, RenderPriority.RESPONSIVE)
  }

  public async drag(clientX: number, clientY: number, dropTarget: FolderBox, snapToGrid: boolean): Promise<void> {
    if (this.referenceBox.isRoot()) {
      util.logWarning('BoxHeader::drag(..) called on rootBox, cannot drag root, also this should never happen.')
      return
    }
    const clientPosition = new ClientPosition(clientX-this.dragOffset.x, clientY-this.dragOffset.y)

    let positionInParentBoxCoords: LocalPosition
    if (!snapToGrid) {
      positionInParentBoxCoords = await this.referenceBox.getParent().transform.clientToLocalPosition(clientPosition)
    } else {
      positionInParentBoxCoords = await this.referenceBox.getParent().transform.getNearestGridPositionOfOtherTransform(clientPosition, dropTarget.transform)
    }

    await this.referenceBox.updateMeasuresAndBorderingLinks({x: positionInParentBoxCoords.percentX, y: positionInParentBoxCoords.percentY}, RenderPriority.RESPONSIVE)
    await dropTarget.rearrangeBoxesWithoutMapData(this.referenceBox)
  }

  public async dragCancel(): Promise<void> {
    await Promise.all([
      renderManager.removeClassFrom(this.referenceBox.getId(), DragManager.draggingInProgressStyleClass, RenderPriority.RESPONSIVE),
      this.referenceBox.restoreMapData()
    ])
  }

  public async dragEnd(dropTarget: FolderBox): Promise<void> {
    const pros: Promise<void>[] = []

    pros.push(renderManager.removeClassFrom(this.referenceBox.getId(), DragManager.draggingInProgressStyleClass, RenderPriority.RESPONSIVE))

    if (!this.referenceBox.isRoot() && this.referenceBox.getParent() != dropTarget) {
      pros.push(this.referenceBox.setParentAndFlawlesslyResizeAndSave(dropTarget))
    } else {
      pros.push(this.referenceBox.saveMapData())
    }

    await Promise.all(pros)
  }

}
