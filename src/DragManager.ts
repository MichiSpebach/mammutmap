import * as util from './util'
import * as dom from './domAdapter'
import { Box } from './box/Box'
import { DirectoryBox } from './box/DirectoryBox'

// TODO: rename to BoxDragManager?
export class DragManager {

  private static draggingBox: Box|null = null // TODO: refactor either both are null or none
  private static dragOverBox: DirectoryBox|null = null

  private static setDragOverBox(box: DirectoryBox|null): void {
    if (this.dragOverBox == box) {
      return
    }

    if (this.dragOverBox != null) {
      this.dragOverBox.setDragOverStyle(false)
    }
    if (box != null) {
      box.setDragOverStyle(true)
    }

    this.dragOverBox = box
  }

  public static addDraggable(elementToDrag: Box): void {
    const draggableId: string = elementToDrag.getDraggableId()

    dom.addDragListenerTo(draggableId, 'dragstart', (clientX: number, clientY: number) => {
      elementToDrag.dragStart(clientX, clientY)
      this.draggingBox = elementToDrag
      this.setDragOverBox(elementToDrag.getParent())
    })

    dom.addDragListenerTo(draggableId, 'drag', (clientX: number, clientY: number) => {
      if (this.dragOverBox == null) {
        util.logWarning("DragManager: dragOverBox is null although dragging is in progress")
        elementToDrag.dragCancel()
        return
      }

      elementToDrag.drag(clientX, clientY, this.dragOverBox)
    })

    dom.addDragListenerTo(draggableId, 'dragend', (clientX: number, clientY: number) => {
      if (this.dragOverBox == null) {
        util.logWarning("DragManager: dragOverBox is null although dragging was in progress")
        elementToDrag.dragCancel()
        return
      }
      // TODO: call elementToDrag.dragCancel() if esc is pressed
      elementToDrag.dragEnd()
      this.draggingBox = null
      this.setDragOverBox(null)
    })
  }

  public static addDropTarget(targetElement: DirectoryBox): void {
    dom.addDragListenerTo(targetElement.getId(), 'dragenter', (_) => this.setDragOverBox(targetElement))
  }

}
