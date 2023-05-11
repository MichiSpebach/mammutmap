import { MouseEventResultAdvanced, renderManager, RenderPriority } from './RenderManager'
import * as indexHtmlIds from './indexHtmlIds'
import { util } from './util/util'
import { ClientPosition } from './shape/ClientPosition'
import { DragManager } from './DragManager'
import { style } from './styleAdapter'

export let mouseDownDragManager: MouseDownDragManager // = new MouseDownDragManager() // initialized at end of file

class MouseDownDragManager implements DragManager {

    private initialized: boolean = false

    private dragState: {
        elementId: string,
        draggingStarted: boolean,
        latest: {mousePosition: ClientPosition, ctrlPressed: boolean},
        onDragEnd: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>
    } | null = null

    public isUsingNativeDragEvents(): boolean {
        return false
    }

    public async addDraggable(options: {
        elementId: string,
        movementNeededToStartDrag?: boolean,
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>,
        onDrag: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>,
        onDragEnd: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>,
        priority?: RenderPriority
    }): Promise<void> {
        const pros: Promise<unknown>[] = []

        pros.push(renderManager.addEventListenerAdvancedTo(options.elementId, 'mousedown', {priority: options.priority, stopPropagation: true}, (eventResult: MouseEventResultAdvanced) => {
            this.dragStart({eventResult, ...options})
        }))

        if (!this.initialized) {
            pros.push(renderManager.addEventListenerTo(indexHtmlIds.htmlId, 'mouseup', (clientX: number, clientY: number, ctrlPressed: boolean) => {
                this.dragEnd(new ClientPosition(clientX, clientY), ctrlPressed)
            }, options.priority))
            this.initialized = true
        }

        await Promise.all(pros)
    }

    public async removeDraggable(elementId: string, priority?: RenderPriority): Promise<void> {
        const pros: Promise<void>[] = [
            renderManager.removeEventListenerFrom(elementId, 'mousedown', {priority}),
            //renderManager.removeEventListenerFrom(indexHtmlIds.htmlId, 'mouseup', {priority}) // TODO: remove or implement counter or do initializing in constructor and destructor
        ]
        if (this.dragState && this.dragState.elementId === elementId) {
            pros.push(this.dragEnd(this.dragState.latest.mousePosition, this.dragState.latest.ctrlPressed))
        }
        await Promise.all(pros)
    }

    private dragStart(options: {
        eventResult: MouseEventResultAdvanced,
        elementId: string,
        movementNeededToStartDrag?: boolean, // TODO: change to 'movementNeededToStartDragInPixels?: number' and implement
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>,
        onDrag: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>,
        onDragEnd: (position: ClientPosition, ctrlPressed: boolean) => Promise<void>
    }): void {
        if (this.dragState) {
            util.logWarning('MouseDownDragManager: there seem to be multiple elements that catch mousedown event at the same time or multiple mouse buttons are pressed.')
            return
        }
        this.dragState = {
            elementId: options.elementId,
            draggingStarted: false,
            latest: {mousePosition: options.eventResult.position, ctrlPressed: options.eventResult.ctrlPressed},
            onDragEnd: options.onDragEnd
        }

        renderManager.addEventListenerTo(indexHtmlIds.htmlId, 'mousemove', async (clientX: number, clientY: number, ctrlPressed: boolean) => {
            if (!this.dragState) {
                return // this happens when mouseup was already fired but mousemove listener is not yet removed
            }
            if (!this.dragState.draggingStarted && options.movementNeededToStartDrag) {
                this.dragState.draggingStarted = true
                await options.onDragStart(options.eventResult)
            }
            this.drag(new ClientPosition(clientX, clientY), ctrlPressed, options.onDrag)
        }, RenderPriority.RESPONSIVE)
        renderManager.addClassTo(indexHtmlIds.htmlId, style.getClass('disableUserSelect'), RenderPriority.RESPONSIVE)

        if (!options.movementNeededToStartDrag) {
            this.dragState.draggingStarted = true
            options.onDragStart(options.eventResult)
        }
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
        
        const pros: Promise<void>[] = []

        pros.push(renderManager.removeEventListenerFrom(indexHtmlIds.htmlId, 'mousemove', {priority: RenderPriority.RESPONSIVE}))
        pros.push(renderManager.removeClassFrom(indexHtmlIds.htmlId, style.getClass('disableUserSelect'), RenderPriority.RESPONSIVE))
        
        if (this.dragState.draggingStarted) {
            pros.push(this.dragState.onDragEnd(position, ctrlPressed))
        }

        this.dragState = null
        await Promise.all(pros)
    }

    public async cancelDrag(elementId: string): Promise<void> {
        if (!this.dragState) {
            util.logWarning(`MouseDownDragManager::cancelDrag(${elementId}) called but dragging is not in progress.`)
            return
        }
        if (this.dragState.elementId !== elementId) {
            util.logWarning(`MouseDownDragManager::cancelDrag(${elementId}) called but dragging is in progress for '${this.dragState.elementId}' not for '${elementId}'.`)
        }
        await this.dragEnd(this.dragState.latest.mousePosition, this.dragState.latest.ctrlPressed)
    }

}

mouseDownDragManager = new MouseDownDragManager()