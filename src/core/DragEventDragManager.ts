import { DragManager } from './DragManager'
import { RenderPriority, renderManager, MouseEventResultAdvanced } from './RenderManager';
import { ClientPosition } from './shape/ClientPosition';

export class DragEventDragManager implements DragManager {
    public isUsingNativeDragEvents(): boolean {
        return true
    }

    public async addDraggable(options: {
        elementId: string;
        movementNeededToStartDrag?: boolean; // movementNeededToStartDrag is ignored or is always true, depends on native drag events
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>;
        onDrag: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>;
        onDragEnd: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>;
        priority?: RenderPriority;
    }): Promise<void> {
        await Promise.all([
            renderManager.addEventListenerTo(options.elementId, 'mousedown', () => {
                /* only to catch mousedown, because mouseDownDragManager would be disturbed by it */
            }, options.priority),
            renderManager.addDragListenerTo(options.elementId, 'dragstart', (clientX: number, clientY: number, ctrlPressed: boolean) => {
                options.onDragStart({position: new ClientPosition(clientX, clientY), ctrlPressed, cursor:'auto', targetPathElementIds: []})
            }, options.priority),
            renderManager.addDragListenerTo(options.elementId, 'drag', (clientX: number, clientY: number, ctrlPressed: boolean) => {
                options.onDrag(new ClientPosition(clientX, clientY), ctrlPressed)
            }, options.priority),
            renderManager.addDragListenerTo(options.elementId, 'dragend', (clientX: number, clientY: number, ctrlPressed: boolean) => {
                options.onDragEnd(new ClientPosition(clientX, clientY), ctrlPressed)
            }, options.priority)
        ])
    }

    public async removeDraggable(elementId: string, priority?: RenderPriority): Promise<void> {
        await Promise.all([
            renderManager.removeEventListenerFrom(elementId, 'mousedown', { priority }),
            renderManager.removeEventListenerFrom(elementId, 'dragstart', { priority }),
            renderManager.removeEventListenerFrom(elementId, 'drag', { priority }),
            renderManager.removeEventListenerFrom(elementId, 'dragend', { priority })
        ])
    }

}