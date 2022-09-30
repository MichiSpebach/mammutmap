import { util } from './util'
import { dom } from './domAdapter'
import { renderManager, RenderPriority } from './RenderManager'
import { Draggable } from './Draggable'
import { DropTarget } from './DropTarget'
import { BoxWatcher } from './box/BoxWatcher'

type State = {
  dragging: Draggable<DropTarget>
  draggingOver: DropTarget
  clickToDropMode: boolean
  watcherOfManagingBoxToPreventUnrenderWhileDragging: Promise<BoxWatcher>
}

export class DragManager {
  private static readonly draggableStyleClass: string = 'draggable'
  public static readonly draggingInProgressStyleClass: string = 'draggingInProgress'
  private static state: State|null = null

  public static isDraggingInProgress(): boolean {
    return this.state !== null
  }

  private static getState(): {dragging: Draggable<DropTarget>, draggingOver: DropTarget, clickToDropMode: boolean} | never {
    if (this.state === null) {
      util.logError("DragManager: state is null but should be set at this moment")
    }
    return this.state
  }

  private static setState(newState: State|null): void {
    this.handleDraggingOverStateChange(newState)
    this.handleWatcherOfManagingBoxStateChange(newState)

    this.state = newState
  }

  private static handleDraggingOverStateChange(newState: State|null) {
    if (this.state?.draggingOver === newState?.draggingOver) {
      return
    }

    if (this.state) {
      this.state.draggingOver.onDragLeave()
    }
    if (newState) {
      newState.draggingOver.onDragEnter()
    }
  }

  private static handleWatcherOfManagingBoxStateChange(newState: State|null) {
    if (this.state?.watcherOfManagingBoxToPreventUnrenderWhileDragging === newState?.watcherOfManagingBoxToPreventUnrenderWhileDragging) {
      return
    }
    
    if (this.state) {
      this.state.watcherOfManagingBoxToPreventUnrenderWhileDragging.then(watcher => watcher.unwatch())
    }
  }

  public static clear(): void { // TODO: this method should not be needed, remove when sure
    this.state = null
    util.setHint(util.hintToDeactivateSnapToGrid, false)
  }

  public static async addDraggable(elementToDrag: Draggable<DropTarget>, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    const draggableId: string = elementToDrag.getId()

    await Promise.all([
      renderManager.addClassTo(draggableId, this.draggableStyleClass, priority),
      renderManager.addDragListenerTo(draggableId, 'dragstart', (clientX: number, clientY: number) => {
        this.onDragStart(elementToDrag, clientX, clientY, false)
      }, priority),
      renderManager.addDragListenerTo(draggableId, 'drag', (clientX: number, clientY: number, ctrlPressed: boolean) => {
        this.onDrag(clientX, clientY, !ctrlPressed)
      }, priority),
      renderManager.addDragListenerTo(draggableId, 'dragend', (_) => {
        this.onDragEnd()
      }, priority)
    ])

    // TODO: call elementToDrag.dragCancel() if esc is pressed (and remove draggingInProgressStyleClass)
  }

  public static async removeDraggable(elementToDrag: Draggable<DropTarget>, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    const draggableId: string = elementToDrag.getId()

    await Promise.all([
      renderManager.removeClassFrom(draggableId, this.draggableStyleClass, priority),
      renderManager.removeEventListenerFrom(draggableId, 'dragstart', priority),
      renderManager.removeEventListenerFrom(draggableId, 'drag', priority),
      renderManager.removeEventListenerFrom(draggableId, 'dragend', priority)
    ])
  }

  private static onDragStart(elementToDrag: Draggable<DropTarget>, clientX: number, clientY: number, clickToDropMode: boolean): void {
    if (this.state) {
      util.logWarning('Expected state to be not set onDragstart.')
    }
    
    this.setState({
      dragging: elementToDrag, 
      draggingOver: elementToDrag.getDropTargetAtDragStart(), 
      clickToDropMode: clickToDropMode,
      watcherOfManagingBoxToPreventUnrenderWhileDragging: BoxWatcher.newAndWatch(elementToDrag.getManagingBox())
    })
    renderManager.addClassTo(elementToDrag.getId(), DragManager.draggingInProgressStyleClass, RenderPriority.RESPONSIVE)
    elementToDrag.dragStart(clientX, clientY)
  }

  private static onDrag(clientX: number, clientY: number, snapToGrid: boolean): void {
    const state: {dragging: Draggable<DropTarget>, draggingOver: DropTarget, clickToDropMode: boolean} = this.getState()
    state.dragging.drag(clientX, clientY, state.draggingOver, snapToGrid)
    util.setHint(util.hintToDeactivateSnapToGrid, snapToGrid)
  }

  private static onDragEnd(): void {
    const state: {dragging: Draggable<DropTarget>, draggingOver: DropTarget, clickToDropMode: boolean} = this.getState()

    renderManager.removeClassFrom(state.dragging.getId(), DragManager.draggingInProgressStyleClass, RenderPriority.RESPONSIVE)
    state.dragging.dragEnd(state.draggingOver)
    this.setState(null)
    util.setHint(util.hintToDeactivateSnapToGrid, false)
  }

  public static addDropTarget(dropTarget: DropTarget): void {
    renderManager.addDragListenerTo(dropTarget.getId(), 'dragenter', async (_) => {
      this.onDragEnter(dropTarget)
    })
    renderManager.addEventListenerTo(dropTarget.getId(), 'mouseover', async (_) => {
      this.onDragEnter(dropTarget)
    })
  }

  public static removeDropTarget(dropTarget: DropTarget): void {
    renderManager.removeEventListenerFrom(dropTarget.getId(), 'dragenter')
    renderManager.removeEventListenerFrom(dropTarget.getId(), 'mouseover')
  }

  private static onDragEnter(dropTarget: DropTarget): void {
    if (this.state == null) {
      //util.logWarning("DragManager: state is null although dragging is in progress") // TODO: reactivate when ensured that eventType is from dragenter not mouseover
      return
    }
    if (!this.state.dragging.canBeDroppedInto(dropTarget)) {
      return
    }
    this.setState({
      dragging: this.state.dragging, 
      draggingOver: dropTarget, 
      clickToDropMode: this.state.clickToDropMode,
      watcherOfManagingBoxToPreventUnrenderWhileDragging: this.state.watcherOfManagingBoxToPreventUnrenderWhileDragging
    })
  }

  public static startDragWithClickToDropMode(elementToDrag: Draggable<DropTarget>) {
    const cursorClientPosition: {x: number, y: number} = dom.getCursorClientPosition();
    this.onDragStart(elementToDrag, cursorClientPosition.x, cursorClientPosition.y, true)

    renderManager.addEventListenerTo('content', 'mousemove', (clientX: number, clientY: number, ctrlPressed: boolean) => {
      this.onDrag(clientX, clientY, !ctrlPressed)
    }, RenderPriority.RESPONSIVE)
    renderManager.addEventListenerTo('content', 'click', (_) => {
      renderManager.removeEventListenerFrom('content', 'mousemove', RenderPriority.RESPONSIVE)
      renderManager.removeEventListenerFrom('content', 'click', RenderPriority.RESPONSIVE)
      this.onDragEnd()
    }, RenderPriority.RESPONSIVE)
  }

}
