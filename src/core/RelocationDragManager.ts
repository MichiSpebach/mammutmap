import { util } from './util/util'
import { EventListenerCallback, MouseEventListenerCallback, MouseEventResultAdvanced, renderManager, RenderPriority } from './renderEngine/renderManager'
import { Draggable } from './Draggable'
import { DropTarget } from './DropTarget'
import { BoxWatcher } from './box/BoxWatcher'
import { ClientPosition } from './shape/ClientPosition'
import { DragManager } from './DragManager'
import { DragEventDragManager } from './DragEventDragManager'
import { mouseDownDragManager } from './mouseDownDragManager'

export let relocationDragManager: RelocationDragManager // = new RelocationDragManager() // initialized at end of file

export function init(object: RelocationDragManager): void {
    relocationDragManager = object
}

type State = {
    dragging: Draggable<DropTarget>
    draggingOver: DropTarget
    deactivateHandlingDragOver: boolean
    clickToDropMode: boolean
    watcherOfManagingBoxToPreventUnrenderWhileDragging: Promise<BoxWatcher>
}

export class RelocationDragManager {
    public readonly draggableStyleClass: string = 'draggable'
    public readonly draggingInProgressStyleClass: string = 'draggingInProgress'
    private readonly dragManager: DragManager = mouseDownDragManager
    
    private readonly dropTargets: Map<string, { dragenterListener: EventListenerCallback, mouseoverListener: EventListenerCallback }> = new Map()

    private state: State | null = null

    public isUsingNativeDragEvents(): boolean {
        return this.dragManager.isUsingNativeDragEvents()
    }

    public isDraggingInProgress(): boolean {
        return this.state !== null
    }

    private getState(): State | never {
        if (this.state === null) {
            util.logError("RelocationDragManager: state is null but should be set at this moment")
        }
        return this.state
    }

    private setState(newState: State | null): void {
        this.handleDraggingOverStateChange(newState)
        this.handleWatcherOfManagingBoxStateChange(newState)

        this.state = newState
    }

    private handleDraggingOverStateChange(newState: State | null) {
        if (newState?.deactivateHandlingDragOver || this.state?.draggingOver === newState?.draggingOver) {
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

    /**
     * 
     * @param elementToDrag 
     * @param deactivateHandlingDragOver if true onDragEnter() and onDragLeave() are not fired on DropTarget
     * @param priority 
     */
    public async addDraggable(elementToDrag: Draggable<DropTarget>, deactivateHandlingDragOver?: boolean, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        const draggableId: string = elementToDrag.getId()

        await Promise.all([
            renderManager.addClassTo(draggableId, this.draggableStyleClass, priority),
            this.dragManager.addDraggable({
                elementId: elementToDrag.getId(),
                movementNeededToStartDrag: true,
                onDragStart: async (eventResult: MouseEventResultAdvanced) => this.onDragStart(elementToDrag, eventResult.clientPosition.x, eventResult.clientPosition.y, !eventResult.ctrlPressed, !!deactivateHandlingDragOver, false),
                onDrag: async (position: ClientPosition, ctrlPressed: boolean) => this.onDrag(position.x, position.y, !ctrlPressed),
                onDragEnd: async (position: ClientPosition, ctrlPressed: boolean) => this.onDragEnd(position.x, position.y, !ctrlPressed)
            })
        ])

        // TODO: call elementToDrag.dragCancel() if esc is pressed (and remove draggingInProgressStyleClass)
    }

    public async removeDraggable(elementToDrag: Draggable<DropTarget>, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        const draggableId: string = elementToDrag.getId()

        await Promise.all([
            renderManager.removeClassFrom(draggableId, this.draggableStyleClass, priority),
            this.dragManager.removeDraggable(draggableId)
        ])
    }

    private async onDragStart(
        elementToDrag: Draggable<DropTarget>,
        clientX: number,
        clientY: number,
        snapToGrid: boolean,
        deactivateHandlingDragOver: boolean,
        clickToDropMode: boolean
    ): Promise<void> {
        if (this.state) {
            util.logWarning('Expected state to be not set onDragstart.')
        }

        this.setState({
            dragging: elementToDrag,
            draggingOver: elementToDrag.getDropTargetAtDragStart(),
            deactivateHandlingDragOver,
            clickToDropMode,
            watcherOfManagingBoxToPreventUnrenderWhileDragging: BoxWatcher.newAndWatch(elementToDrag.getManagingBox())
        })
        await this.state?.watcherOfManagingBoxToPreventUnrenderWhileDragging
        await Promise.all([
            renderManager.addClassTo(elementToDrag.getId(), this.draggingInProgressStyleClass, RenderPriority.RESPONSIVE),
            elementToDrag.dragStart(clientX, clientY, this.getState().draggingOver, snapToGrid)
        ])
    }

    private async onDrag(clientX: number, clientY: number, snapToGrid: boolean): Promise<void> {
        const state: State = this.getState()
        await state.watcherOfManagingBoxToPreventUnrenderWhileDragging

        state.dragging.drag(clientX, clientY, state.draggingOver, snapToGrid)
        util.setHint(util.hintToDeactivateSnapToGrid, snapToGrid)
    }

    private async onDragEnd(clientX: number, clientY: number, snapToGrid: boolean): Promise<void> {
        const state: State = this.getState()
        await state.watcherOfManagingBoxToPreventUnrenderWhileDragging

        renderManager.removeClassFrom(state.dragging.getId(), this.draggingInProgressStyleClass, RenderPriority.RESPONSIVE)
        state.dragging.dragEnd(clientX, clientY, state.draggingOver, snapToGrid)
        this.setState(null)
        util.setHint(util.hintToDeactivateSnapToGrid, false)
    }

    // TODO: remove and do this instead in addDropTarget (for each dropTarget)?
    /** removes forbidden cursor */
    public async addDropZone(elementId: string): Promise<void> {
        if (this.dragManager.isUsingNativeDragEvents()) {
            await renderManager.addDragListenerTo(elementId, 'dragover', () => { })
        }
    }

    // TODO: remove and do this instead in removeDropTarget (for each dropTarget)?
    public async removeDropZone(elementId: string): Promise<void> {
        if (this.dragManager.isUsingNativeDragEvents()) {
            await renderManager.removeEventListenerFrom(elementId, 'dragover') // TODO: call with specific listener
        }
    }

    public async addDropTarget(dropTarget: DropTarget): Promise<void> {
        if (this.dropTargets.has(dropTarget.getId())) {
            util.logWarning(`RelocationDragManager::addDropTarget(..) dropTarget with id '${dropTarget.getId()}' already exists.`)
        }

        const dragenterListener: MouseEventListenerCallback = () => this.onDragEnter(dropTarget)
        const mouseoverListener: MouseEventListenerCallback = () => this.onDragEnter(dropTarget)
        this.dropTargets.set(dropTarget.getId(), { dragenterListener, mouseoverListener })

        const pros: Promise<void>[] = []

        // also needed if this.isUsingNativeDragEvents() because of startDragWithClickToDropMode
        pros.push(renderManager.addEventListenerTo(dropTarget.getId(), 'mouseover', mouseoverListener))

        if (this.isUsingNativeDragEvents()) {
            pros.push(renderManager.addDragListenerTo(dropTarget.getId(), 'dragenter', dragenterListener))
        }

        await Promise.all(pros)
    }

    public async removeDropTarget(dropTarget: DropTarget): Promise<void> {
        const listeners: { dragenterListener: EventListenerCallback, mouseoverListener: EventListenerCallback } | undefined = this.dropTargets.get(dropTarget.getId())
        if (!listeners) {
            util.logWarning(`RelocationDragManager::removeDropTarget(..) dropTarget with id '${dropTarget.getId()}' not found.`)
            return
        }

        this.dropTargets.delete(dropTarget.getId())

        const pros: Promise<void>[] = []

        pros.push(renderManager.removeEventListenerFrom(dropTarget.getId(), 'mouseover', { listenerCallback: listeners.mouseoverListener }))

        if (this.isUsingNativeDragEvents()) {
            pros.push(renderManager.removeEventListenerFrom(dropTarget.getId(), 'dragenter', { listenerCallback: listeners.dragenterListener }))
        }

        await Promise.all(pros)
    }

    private onDragEnter(dropTarget: DropTarget): void {
        if (this.state == null) {
            //util.logWarning("RelocationDragManager: state is null although dragging is in progress") // TODO: reactivate when ensured that eventType is from dragenter not mouseover
            return
        }
        if (!this.state.dragging.canBeDroppedInto(dropTarget)) {
            return
        }
        this.setState({
            ...this.state,
            draggingOver: dropTarget
        })
    }

    public async startDragWithClickToDropMode(elementToDrag: Draggable<DropTarget>, deactivateHandlingDragOver?: boolean): Promise<void> {
        const cursorClientPosition: { x: number, y: number } = renderManager.getCursorClientPosition();
        const onMouseMove: MouseEventListenerCallback = (clientX: number, clientY: number, ctrlPressed: boolean) => {
            this.onDrag(clientX, clientY, !ctrlPressed)
        }
        const onClick: MouseEventListenerCallback = (clientX: number, clientY: number, ctrlPressed: boolean) => {
            renderManager.removeEventListenerFrom('content', 'mousemove', { priority: RenderPriority.RESPONSIVE, listenerCallback: onMouseMove })
            renderManager.removeEventListenerFrom('content', 'click', { priority: RenderPriority.RESPONSIVE, listenerCallback: onClick })
            this.onDragEnd(clientX, clientY, !ctrlPressed)
        }
        await Promise.all([
            this.onDragStart(elementToDrag, cursorClientPosition.x, cursorClientPosition.y, false/*TODO?: check if ctrl is pressed*/, !!deactivateHandlingDragOver, true),
            renderManager.addEventListenerTo('content', 'mousemove', onMouseMove, RenderPriority.RESPONSIVE),
            renderManager.addEventListenerTo('content', 'click', onClick, RenderPriority.RESPONSIVE)
        ])
    }

}

relocationDragManager = new RelocationDragManager()