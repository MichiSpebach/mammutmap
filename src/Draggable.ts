import { Box } from './box/Box'
import { DropTarget } from './DropTarget'

export interface Draggable<DropTargetType extends DropTarget> {
  getId(): string
  getManagingBox(): Box
  getDropTargetAtDragStart(): DropTargetType
  canBeDroppedInto(dropTarget: DropTarget): boolean

  dragStart(clientX: number, clientY: number): Promise<void>
  drag(clientX: number, clientY: number, dropTarget: DropTargetType, snapToGrid: boolean): Promise<void>
  dragCancel(): Promise<void>
  dragEnd(dropTarget: DropTargetType): Promise<void>
}
