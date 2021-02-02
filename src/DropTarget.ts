export interface DropTarget {
  getId(): string
  setDragOverStyle(value: boolean): Promise<void>
}
