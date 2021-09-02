import * as util from './util'
import { dom } from './domAdapter'
import { Draggable } from './Draggable'
import { DropTarget } from './DropTarget'

export class DragManager {
  private static readonly draggableStyleClass: string = 'draggable'
  public static readonly draggingInProgressStyleClass: string = 'draggingInProgress'

  private static state: {
    dragging: Draggable<DropTarget>
    draggingOver: DropTarget
    clickToDropMode: boolean
  } | null

  private static getState(): {dragging: Draggable<DropTarget>, draggingOver: DropTarget, clickToDropMode: boolean} | never {
    if (this.state === null) {
      util.logError("DragManager: state is null but should be set at this moment")
    }
    return this.state
  }

  private static setState(newState: {dragging: Draggable<DropTarget>, draggingOver: DropTarget, clickToDropMode: boolean} | null): void {
    if (this.state != null) {
      this.state.draggingOver.setDragOverStyle(false)
    }
    if (newState != null) {
      newState.draggingOver.setDragOverStyle(true)
    }

    this.state = newState
  }

  public static clear(): void {
    this.state = null
  }

  public static addDraggable(elementToDrag: Draggable<DropTarget>): void {
    const draggableId: string = elementToDrag.getId()

    dom.addClassTo(draggableId, this.draggableStyleClass)

    dom.addDragListenerTo(draggableId, 'dragstart', (clientX: number, clientY: number) => {
      this.onDragStart(elementToDrag, clientX, clientY, false)
    })

    dom.addDragListenerTo(draggableId, 'drag', (clientX: number, clientY: number) => {
      this.onDrag(clientX, clientY)
    })

    dom.addDragListenerTo(draggableId, 'dragend', (_) => {
      this.onDragEnd()
    })

    // TODO: call elementToDrag.dragCancel() if esc is pressed (and remove draggingInProgressStyleClass)
  }

  private static onDragStart(elementToDrag: Draggable<DropTarget>, clientX: number, clientY: number, clickToDropMode: boolean) {
    dom.addClassTo(elementToDrag.getId(), DragManager.draggingInProgressStyleClass)
    elementToDrag.dragStart(clientX, clientY)
    this.setState({dragging: elementToDrag, draggingOver: elementToDrag.getDropTargetAtDragStart(), clickToDropMode: clickToDropMode})
  }

  private static onDrag(clientX: number, clientY: number) {
    this.getState().dragging.drag(clientX, clientY)
  }

  private static onDragEnd() {
    const state: {dragging: Draggable<DropTarget>, draggingOver: DropTarget, clickToDropMode: boolean} = this.getState()

    dom.removeClassFrom(state.dragging.getId(), DragManager.draggingInProgressStyleClass)
    state.dragging.dragEnd(state.draggingOver)
    this.setState(null)
  }

  public static addDropTarget(dropTarget: DropTarget): void {
    dom.addDragListenerTo(dropTarget.getId(), 'dragenter', async (_) => {
      this.onDragEnter(dropTarget)
    })
    dom.addEventListenerTo(dropTarget.getId(), 'mouseover', async (_) => {
      this.onDragEnter(dropTarget)
    })
  }

  private static onDragEnter(dropTarget: DropTarget): void {
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
    this.setState({dragging: this.state.dragging, draggingOver: dropTarget, clickToDropMode: this.state.clickToDropMode})
  }

  public static startDragWithClickToDropMode(elementToDrag: Draggable<DropTarget>) {
    const cursorClientPosition: {x: number, y: number} = dom.getCursorClientPosition();
    this.onDragStart(elementToDrag, cursorClientPosition.x, cursorClientPosition.y, true)

    dom.addRemovableEventListenerTo('content', 'mousemove', (clientX: number, clientY: number) => {
      this.onDrag(clientX, clientY)
    })
    dom.addRemovableEventListenerTo('content', 'click', (_) => {
      dom.removeEventListenerFrom('content', 'mousemove')
      dom.removeEventListenerFrom('content', 'click')
      this.onDragEnd()
    })
  }

}
