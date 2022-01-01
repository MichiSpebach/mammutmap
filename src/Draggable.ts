import { DropTarget } from './DropTarget'

export interface Draggable<DropTargetType extends DropTarget> {
  getId(): string
  getDropTargetAtDragStart(): DropTargetType
  canBeDroppedInto(dropTarget: DropTarget): boolean

  dragStart(clientX: number, clientY: number): Promise<void>
  drag(clientX: number, clientY: number, dropTarget: DropTargetType): Promise<void>
  dragCancel(): Promise<void>
  dragEnd(dropTarget: DropTargetType): Promise<void>
}
