import * as util from './util'
import * as dom from './domAdapter'
import { Draggable } from './Draggable'
import { DropTarget } from './DropTarget'

export class DragManager {

  private static readonly draggableStyleClass: string = 'draggable'

  private static state: {
    dragging: Draggable<DropTarget>
    draggingOver: DropTarget
  } | null

  private static setState(newState: {dragging: Draggable<DropTarget>, draggingOver: DropTarget} | null): void {
    if (this.state != null) {
      this.state.draggingOver.setDragOverStyle(false)
    }
    if (newState != null) {
      newState.draggingOver.setDragOverStyle(true)
    }

    this.state = newState
  }

  public static addDraggable(elementToDrag: Draggable<DropTarget>): void {
    const draggableId: string = elementToDrag.getId()

    dom.addClassTo(draggableId, this.draggableStyleClass)

    dom.addDragListenerTo(draggableId, 'dragstart', (clientX: number, clientY: number) => {
      elementToDrag.dragStart(clientX, clientY)
      this.setState({dragging: elementToDrag, draggingOver: elementToDrag.getDropTargetAtDragStart()})
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

  public static addDropTarget(dropTarget: DropTarget): void {
    dom.addDragListenerTo(dropTarget.getId(), 'dragenter', async (_) => {
      //if (!await dom.containsClass(sourceId, this.draggableStyleClass)) {
      //  return // TODO: make this somehow work, sourceId is not contained in dragenter event
      //}
      if (this.state == null) {
        //util.logWarning("DragManager: state is null although dragging is in progress") // TODO: reactivate when condition above works
        return
      }
      if (!this.state.dragging.canBeDroppedInto(dropTarget)) {
        return
      }
      this.setState({dragging: this.state.dragging, draggingOver: dropTarget})
    })
  }

}
