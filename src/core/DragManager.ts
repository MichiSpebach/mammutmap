import { RenderPriority } from './RenderManager'
import { MouseEventResultAdvanced } from './domAdapter'
import { ClientPosition } from './shape/ClientPosition'

export interface DragManager {
    addDraggable(options: {
        elementId: string,
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>,
        onDrag: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>,
        onDragEnd: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>,
        priority?: RenderPriority
    }): Promise<void>

    removeDraggable(elementId: string, priority?: RenderPriority): Promise<void>
}