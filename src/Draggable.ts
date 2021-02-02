import { FolderBox } from './box/FolderBox'

export interface Draggable {
  getId(): string
  getDropTargetAtDragStart(): FolderBox

  dragStart(clientX: number, clientY: number): Promise<void>
  drag(clientX: number, clientY: number): Promise<void>
  dragCancel(): Promise<void>
  dragEnd(dropTarget: FolderBox): Promise<void>
}
