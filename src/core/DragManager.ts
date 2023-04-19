import { RenderPriority } from './RenderManager'
import { Draggable } from './Draggable'
import { DropTarget } from './DropTarget'

export abstract class DragManager {
    public readonly draggableStyleClass: string = 'draggable'
    public readonly draggingInProgressStyleClass: string = 'draggingInProgress'
    public abstract isDraggingInProgress(): boolean
    public abstract clear(): void // TODO: this method should not be needed, remove when sure
    public abstract addDraggable(elementToDrag: Draggable<DropTarget>, priority?: RenderPriority): Promise<void>
    public abstract removeDraggable(elementToDrag: Draggable<DropTarget>, priority?: RenderPriority): Promise<void>
    public abstract addDropTarget(dropTarget: DropTarget): Promise<void>
    public abstract removeDropTarget(dropTarget: DropTarget): Promise<void>
    public abstract addDropZone(elementId: string): Promise<void>
    public abstract removeDropZone(elementId: string): Promise<void>
    public abstract startDragWithClickToDropMode(elementToDrag: Draggable<DropTarget>): Promise<void>
}

import { DragEventDragManager } from './DragEventDragManager' // TODO otherwise cycle, find better solution

export const dragManager: DragManager = new DragEventDragManager()