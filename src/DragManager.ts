import * as util from './util'
import * as dom from './domAdapter'
import { Box } from './box/Box'
import { DirectoryBox } from './box/DirectoryBox'

// TODO: rename to BoxDragManager?
export class DragManager {

  private static draggingBox: Box|null = null
  private static dragOverBox: DirectoryBox|null = null

  public static addDraggable(elementToDrag: Box): void {
    let draggableId: string = elementToDrag.getId()//elementToDrag.getDraggableId()

    dom.addDragListenerTo(draggableId, 'dragstart', (clientX: number, clientY: number) => {
      //dom.removeDragEnterListenerFrom(draggableId)
      elementToDrag.dragStart(clientX, clientY)
      this.draggingBox = elementToDrag
    })

    //dom.addDragListenerTo(draggableId, 'drag', (clientX: number, clientY: number) => elementToDrag.drag(clientX, clientY))

    dom.addDragListenerTo(draggableId, 'dragend', (clientX: number, clientY: number) => {
      //dom.addDragEnterListenerTo(draggableId)
      elementToDrag.dragEnd(clientX, clientY)
      this.draggingBox = null
      this.dragOverBox = null
    })
  }

  public static addDropTarget(targetElement: DirectoryBox): void {
    dom.addDragEnterListenerTo(targetElement.getId(), 'dragenter', targetElement.getDraggableId(), () => {
      if (this.dragOverBox == targetElement) {
        return
      }
      util.logInfo('addDropTarget ' + targetElement.getId())

      if (this.dragOverBox != null) {
        this.dragOverBox.setDragOverStyle(false)
      }
      this.dragOverBox = targetElement
      this.dragOverBox.setDragOverStyle(true)
    })
  }

}
