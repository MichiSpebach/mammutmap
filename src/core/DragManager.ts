import { RenderPriority } from './renderEngine/renderManager'
import { MouseEventResultAdvanced } from './renderEngine/domAdapter'
import { ClientPosition } from './shape/ClientPosition'

export interface DragManager {
    isUsingNativeDragEvents(): boolean

    addDraggable(options: {
        elementId: string,
        movementNeededToStartDrag?: boolean,
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>,
        onDrag: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>,
        onDragEnd: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>,
        priority?: RenderPriority
    }): Promise<void>

    removeDraggable(elementId: string, priority?: RenderPriority): Promise<void>
}