import * as dom from './domAdapter'
import { Box } from './box/Box'
import { DirectoryBox } from './box/DirectoryBox'

// TODO: rename to BoxDragManager?
export class DragManager {

  private static draggingBox: Box|null = null
  private static dragOverBox: DirectoryBox|null = null

  public static addDragListenerTo(): void {
    // TODO: wip or delete
  }

  public static addDragEnterListenerTo(): void {
    // TODO: wip or delete
  }

  public static addDraggable(elementIdForListener: String, elementToDrag: Box): void {
    // TODO: wip
  }

  public static addDropTarget(targetElement: DirectoryBox) {
    // TODO: wip
  }
}
