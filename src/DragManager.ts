import * as util from './util'
import * as dom from './domAdapter'
import { BoxHeader } from './box/BoxHeader'
import { FolderBox } from './box/FolderBox'

// TODO: rename to BoxDragManager?
export class DragManager {

  private static state: {
    dragging: BoxHeader
    draggingOver: FolderBox
  } | null

  private static setState(newState: {dragging: BoxHeader, draggingOver: FolderBox} | null): void {
    if (this.state != null) {
      this.state.draggingOver.setDragOverStyle(false)
    }
    if (newState != null) {
      newState.draggingOver.setDragOverStyle(true)
    }

    this.state = newState
  }

  public static addDraggable(elementToDrag: BoxHeader): void {
    const draggableId: string = elementToDrag.getId()

    dom.addDragListenerTo(draggableId, 'dragstart', (clientX: number, clientY: number) => {
      elementToDrag.dragStart(clientX, clientY)
      this.setState({dragging: elementToDrag, draggingOver: elementToDrag.referenceBox.getParent()})
    })

    dom.addDragListenerTo(draggableId, 'drag', (clientX: number, clientY: number) => {
      if (this.state == null) {
        util.logWarning("DragManager: state is null although dragging is in progress")
        elementToDrag.dragCancel()
        return
      }
      elementToDrag.drag(clientX, clientY)
    })

    dom.addDragListenerTo(draggableId, 'dragend', (_) => {
      if (this.state == null) {
        util.logWarning("DragManager: state is null although dragging was in progress")
        elementToDrag.dragCancel()
        return
      }
      elementToDrag.dragEnd(this.state.draggingOver)
      this.setState(null)
    })

    // TODO: call elementToDrag.dragCancel() if esc is pressed
  }

  public static addDropTarget(targetElement: FolderBox): void {
    dom.addDragListenerTo(targetElement.getId(), 'dragenter', (_) => {
      if (this.state == null) {
        util.logWarning("DragManager: state is null although dragging is in progress")
        return
      }
      this.setState({dragging: this.state.dragging, draggingOver: targetElement})
    })
  }

}
