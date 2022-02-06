export interface DropTarget {
  getId(): string
  onDragEnter(): Promise<void>
  onDragLeave(): Promise<void>
}
