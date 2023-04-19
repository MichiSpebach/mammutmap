import { util } from './util/util'
import { EventListenerCallback, MouseEventListenerCallback, renderManager, RenderPriority } from './RenderManager'
import { Draggable } from './Draggable'
import { DropTarget } from './DropTarget'
import { BoxWatcher } from './box/BoxWatcher'
import { DragManager } from './DragManager'

type State = {
    dragging: Draggable<DropTarget>
    draggingOver: DropTarget
    clickToDropMode: boolean
    watcherOfManagingBoxToPreventUnrenderWhileDragging: Promise<BoxWatcher>
}

export class DragEventDragManager extends DragManager {
    
    private readonly dropTargets: Map<string, { dragenterListener: EventListenerCallback, mouseoverListener: EventListenerCallback }> = new Map()

    private state: State | null = null

    public isDraggingInProgress(): boolean {
        return this.state !== null
    }

    private getState(): { dragging: Draggable<DropTarget>, draggingOver: DropTarget, clickToDropMode: boolean } | never {
        if (this.state === null) {
            util.logError("DragManager: state is null but should be set at this moment")
        }
        return this.state
    }

    private setState(newState: State | null): void {
        this.handleDraggingOverStateChange(newState)
        this.handleWatcherOfManagingBoxStateChange(newState)

        this.state = newState
    }

    private handleDraggingOverStateChange(newState: State | null) {
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

    private handleWatcherOfManagingBoxStateChange(newState: State | null) {
        if (this.state?.watcherOfManagingBoxToPreventUnrenderWhileDragging === newState?.watcherOfManagingBoxToPreventUnrenderWhileDragging) {
            return
        }

        if (this.state) {
            this.state.watcherOfManagingBoxToPreventUnrenderWhileDragging.then(watcher => watcher.unwatch())
        }
    }

    public clear(): void { // TODO: this method should not be needed, remove when sure
        this.state = null
        util.setHint(util.hintToDeactivateSnapToGrid, false)
    }

    public async addDraggable(elementToDrag: Draggable<DropTarget>, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        const draggableId: string = elementToDrag.getId()

        await Promise.all([
            renderManager.addClassTo(draggableId, this.draggableStyleClass, priority),
            renderManager.addEventListenerTo(draggableId, 'mousedown', () => {/* only to catch mousedown, because mouseDownDragManager would be disturbed by it */ }),
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

    public async removeDraggable(elementToDrag: Draggable<DropTarget>, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        const draggableId: string = elementToDrag.getId()

        await Promise.all([
            renderManager.removeClassFrom(draggableId, this.draggableStyleClass, priority),
            renderManager.removeEventListenerFrom(draggableId, 'mousedown', { priority }),
            renderManager.removeEventListenerFrom(draggableId, 'dragstart', { priority }),
            renderManager.removeEventListenerFrom(draggableId, 'drag', { priority }),
            renderManager.removeEventListenerFrom(draggableId, 'dragend', { priority })
        ])
    }

    private onDragStart(elementToDrag: Draggable<DropTarget>, clientX: number, clientY: number, clickToDropMode: boolean): void {
        if (this.state) {
            util.logWarning('Expected state to be not set onDragstart.')
        }

        this.setState({
            dragging: elementToDrag,
            draggingOver: elementToDrag.getDropTargetAtDragStart(),
            clickToDropMode: clickToDropMode,
            watcherOfManagingBoxToPreventUnrenderWhileDragging: BoxWatcher.newAndWatch(elementToDrag.getManagingBox())
        })
        renderManager.addClassTo(elementToDrag.getId(), this.draggingInProgressStyleClass, RenderPriority.RESPONSIVE)
        elementToDrag.dragStart(clientX, clientY)
    }

    private onDrag(clientX: number, clientY: number, snapToGrid: boolean): void {
        const state: { dragging: Draggable<DropTarget>, draggingOver: DropTarget, clickToDropMode: boolean } = this.getState()
        state.dragging.drag(clientX, clientY, state.draggingOver, snapToGrid)
        util.setHint(util.hintToDeactivateSnapToGrid, snapToGrid)
    }

    private onDragEnd(): void {
        const state: { dragging: Draggable<DropTarget>, draggingOver: DropTarget, clickToDropMode: boolean } = this.getState()

        renderManager.removeClassFrom(state.dragging.getId(), this.draggingInProgressStyleClass, RenderPriority.RESPONSIVE)
        state.dragging.dragEnd(state.draggingOver)
        this.setState(null)
        util.setHint(util.hintToDeactivateSnapToGrid, false)
    }

    // TODO: remove and do this instead in addDropTarget (for each dropTarget)?
    /** removes forbidden cursor */
    public async addDropZone(elementId: string): Promise<void> {
        await renderManager.addDragListenerTo(elementId, 'dragover', () => { })
    }

    // TODO: remove and do this instead in removeDropTarget (for each dropTarget)?
    public async removeDropZone(elementId: string): Promise<void> {
        await renderManager.removeEventListenerFrom(elementId, 'dragover') // TODO: call with specific listener
    }

    public async addDropTarget(dropTarget: DropTarget): Promise<void> {
        if (this.dropTargets.has(dropTarget.getId())) {
            util.logWarning(`DragManager::addDropTarget(..) dropTarget with id '${dropTarget.getId()}' already exists.`)
        }

        const dragenterListener: MouseEventListenerCallback = () => this.onDragEnter(dropTarget)
        const mouseoverListener: MouseEventListenerCallback = () => this.onDragEnter(dropTarget)
        this.dropTargets.set(dropTarget.getId(), { dragenterListener, mouseoverListener })

        await Promise.all([
            renderManager.addDragListenerTo(dropTarget.getId(), 'dragenter', dragenterListener),
            renderManager.addEventListenerTo(dropTarget.getId(), 'mouseover', mouseoverListener)
        ])
    }

    public async removeDropTarget(dropTarget: DropTarget): Promise<void> {
        const listeners: { dragenterListener: EventListenerCallback, mouseoverListener: EventListenerCallback } | undefined = this.dropTargets.get(dropTarget.getId())
        if (!listeners) {
            util.logWarning(`DragManager::removeDropTarget(..) dropTarget with id '${dropTarget.getId()}' not found.`)
            return
        }

        this.dropTargets.delete(dropTarget.getId())

        await Promise.all([
            renderManager.removeEventListenerFrom(dropTarget.getId(), 'dragenter', { listenerCallback: listeners.dragenterListener }),
            renderManager.removeEventListenerFrom(dropTarget.getId(), 'mouseover', { listenerCallback: listeners.mouseoverListener })
        ])
    }

    private onDragEnter(dropTarget: DropTarget): void {
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

    public async startDragWithClickToDropMode(elementToDrag: Draggable<DropTarget>): Promise<void> {
        const cursorClientPosition: { x: number, y: number } = renderManager.getCursorClientPosition();
        this.onDragStart(elementToDrag, cursorClientPosition.x, cursorClientPosition.y, true)

        await Promise.all([
            renderManager.addEventListenerTo('content', 'mousemove', (clientX: number, clientY: number, ctrlPressed: boolean) => {
                this.onDrag(clientX, clientY, !ctrlPressed)
            }, RenderPriority.RESPONSIVE),
            renderManager.addEventListenerTo('content', 'click', (_) => {
                renderManager.removeEventListenerFrom('content', 'mousemove', { priority: RenderPriority.RESPONSIVE })
                renderManager.removeEventListenerFrom('content', 'click', { priority: RenderPriority.RESPONSIVE })
                this.onDragEnd()
            }, RenderPriority.RESPONSIVE)
        ])
    }

}