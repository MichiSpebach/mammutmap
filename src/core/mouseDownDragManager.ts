import { MouseEventResultAdvanced, renderManager, RenderPriority } from './RenderManager'
import * as indexHtmlIds from './indexHtmlIds'
import { util } from './util/util'
import { ClientPosition } from './shape/ClientPosition'
import { DragManager } from './DragManager'

export let mouseDownDragManager: MouseDownDragManager // = new MouseDownDragManager() // initialized at end of file

class MouseDownDragManager implements DragManager {

    private initialized: boolean = false

    private dragState: {
        latest: {mousePosition: ClientPosition, ctrlPressed: boolean},
        onDragEnd: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>
    } | null = null

    public async addDraggable(options: {
        elementId: string,
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>,
        onDrag: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>,
        onDragEnd: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>,
        priority?: RenderPriority
    }): Promise<void> {
        const pros: Promise<unknown>[] = []

        pros.push(renderManager.addEventListenerAdvancedTo(options.elementId, 'mousedown', {priority: options.priority, stopPropagation: true}, (eventResult: MouseEventResultAdvanced) => {
            this.dragStart(eventResult, options.onDragStart, options.onDrag, options.onDragEnd)
        }))

        if (!this.initialized) {
            pros.push(renderManager.addEventListenerTo(indexHtmlIds.htmlId, 'mouseup', (clientX: number, clientY: number, ctrlPressed: boolean) => {
                this.dragEnd(new ClientPosition(clientX, clientY), ctrlPressed)
            }, options.priority))
            this.initialized = true
        }

        await Promise.all(pros)
    }

    public async removeDraggable(elementId: string): Promise<void> {
        const pros: Promise<void>[] = [
            renderManager.removeEventListenerFrom(elementId, 'mousedown'),
            //renderManager.removeEventListenerFrom(indexHtmlIds.htmlId, 'mouseup') // TODO: remove or implement counter or do initializing in constructor and destructor
        ]
        if (this.dragState) {
            pros.push(this.dragEnd(this.dragState.latest.mousePosition, this.dragState.latest.ctrlPressed))
        }
        await Promise.all(pros)
    }

    private dragStart(
        eventResult: MouseEventResultAdvanced,
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>,
        onDrag: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>,
        onDragEnd: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>
    ): void {
        if (this.dragState) {
            util.logWarning('MouseDownDragManager: there seem to be multiple elements that catch mousedown event at the same time or multiple mouse buttons are pressed.')
            return
        }
        this.dragState = {latest: {mousePosition: eventResult.position, ctrlPressed: eventResult.ctrlPressed}, onDragEnd}

        renderManager.addEventListenerTo(indexHtmlIds.htmlId, 'mousemove', (clientX: number, clientY: number, ctrlPressed: boolean) => {
            this.drag(new ClientPosition(clientX, clientY), ctrlPressed, onDrag)
        }, RenderPriority.RESPONSIVE)
        onDragStart(eventResult)
    }

    private drag(
        position: ClientPosition, ctrlPressed: boolean, 
        onDrag: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>
    ): void {
        if (!this.dragState) {
            return // this happens when mouseup was already fired but mousemove listener is not yet removed
        }
        this.dragState.latest = {mousePosition: position, ctrlPressed}

        onDrag(position, ctrlPressed)
    }

    private async dragEnd(position: ClientPosition, ctrlPressed: boolean): Promise<void> {
        if (!this.dragState) {
            return // this happens when unrelated mouseup events are fired anywhere in the app
        }
        
        await Promise.all([
            renderManager.removeEventListenerFrom(indexHtmlIds.htmlId, 'mousemove', {priority: RenderPriority.RESPONSIVE}),
            this.dragState.onDragEnd(position, ctrlPressed),
            this.dragState = null
        ])
    }

}

mouseDownDragManager = new MouseDownDragManager()