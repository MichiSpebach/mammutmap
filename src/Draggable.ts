import { DropTarget } from './DropTarget'

export interface Draggable<DropTargetType extends DropTarget> {
  getId(): string
  getDropTargetAtDragStart(): DropTargetType

  dragStart(clientX: number, clientY: number): Promise<void>
  drag(clientX: number, clientY: number): Promise<void>
  dragCancel(): Promise<void>
  dragEnd(dropTarget: DropTargetType): Promise<void>
}
