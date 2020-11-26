import * as util from './util'
import * as dom from './domAdapter'
import { Box } from './box/Box'
import { DirectoryBox } from './box/DirectoryBox'

// TODO: rename to BoxDragManager?
export class DragManager {

  private static draggingBox: Box|null = null
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
    let draggableId: string = elementToDrag.getId()//elementToDrag.getDraggableId()

    dom.addDragListenerTo(draggableId, 'dragstart', (clientX: number, clientY: number) => {
      elementToDrag.dragStart(clientX, clientY)
      this.draggingBox = elementToDrag
    })

    dom.addDragListenerTo(draggableId, 'drag', (clientX: number, clientY: number) => elementToDrag.drag(clientX, clientY))

    // TODO: addDragCancelListener

    dom.addDragListenerTo(draggableId, 'dragend', (clientX: number, clientY: number) => {
      if (this.dragOverBox == null) {
        util.logError("DragManager: dragOverBox is null although dragging was in progress")
      }
      elementToDrag.dragEnd(clientX, clientY, this.dragOverBox)
      this.draggingBox = null
      this.setDragOverBox(null)
    })
  }

  public static addDropTarget(targetElement: DirectoryBox): void {
    dom.addDragListenerTo(targetElement.getId(), 'dragenter', (_) => this.setDragOverBox(targetElement))
  }

}
