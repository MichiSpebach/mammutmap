import * as util from './util'
import * as dom from './domAdapter'
import { Box } from './box/Box'
import { DirectoryBox } from './box/DirectoryBox'

// TODO: rename to BoxDragManager?
export class DragManager {

  private static state: {
    dragging: Box
    draggingOver: DirectoryBox
  } | null

  private static setState(newState: {dragging: Box, draggingOver: DirectoryBox} | null): void {
    if (this.state != null) {
      this.state.draggingOver.setDragOverStyle(false)
    }
    if (newState != null) {
      newState.draggingOver.setDragOverStyle(true)
    }

    this.state = newState
  }

  public static addDraggable(elementToDrag: Box): void {
    const draggableId: string = elementToDrag.getDraggableId()

    dom.addDragListenerTo(draggableId, 'dragstart', (clientX: number, clientY: number) => {
      elementToDrag.dragStart(clientX, clientY)
      this.setState({dragging: elementToDrag, draggingOver: elementToDrag.getParent()})
    })

    dom.addDragListenerTo(draggableId, 'drag', (clientX: number, clientY: number) => {
      if (this.state == null) {
        util.logWarning("DragManager: state is null although dragging is in progress")
        elementToDrag.dragCancel()
        return
      }
      elementToDrag.drag(clientX, clientY, this.state.draggingOver)
    })

    dom.addDragListenerTo(draggableId, 'dragend', (_) => {
      if (this.state == null) {
        util.logWarning("DragManager: state is null although dragging was in progress")
        elementToDrag.dragCancel()
        return
      }
      elementToDrag.dragEnd()
      this.setState(null)
    })

    // TODO: call elementToDrag.dragCancel() if esc is pressed
  }

  public static addDropTarget(targetElement: DirectoryBox): void {
    dom.addDragListenerTo(targetElement.getId(), 'dragenter', (_) => {
      if (this.state == null) {
        util.logWarning("DragManager: state is null although dragging is in progress")
        return
      }
      this.setState({dragging: this.state.dragging, draggingOver: targetElement})
    })
  }

}
