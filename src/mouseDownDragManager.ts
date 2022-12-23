import { MouseEventResultAdvanced, renderManager, RenderPriority } from './RenderManager'
import * as indexHtmlIds from './indexHtmlIds'
import { util } from './util'
import { ClientPosition } from './box/Transform'

export let mouseDownDragManager: MouseDownDragManager // = new MouseDownDragManager() // initialized at end of file

class MouseDownDragManager { // TODO: rename to MouseDownMoveManager?
    
    private dragState: {
        latest: {mousePosition: ClientPosition, ctrlPressed: boolean},
        onDragEnd: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>
    } | null = null

    public async addDraggable(
        elementId: string,
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>,
        onDrag: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>,
        onDragEnd: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>
    ): Promise<void> {
        await Promise.all([
            renderManager.addEventListenerAdvancedTo(elementId, 'mousedown', (eventResult: MouseEventResultAdvanced) => {
                this.dragStart(eventResult, onDragStart, onDrag, onDragEnd)
            }),
            renderManager.addEventListenerTo(indexHtmlIds.htmlId, 'mouseup', (clientX: number, clientY: number, ctrlPressed: boolean) => {
                this.dragEnd(new ClientPosition(clientX, clientY), ctrlPressed)
            })
        ])
    }

    public async removeDraggable(elementId: string): Promise<void> {
        const pros: Promise<void>[] = [
            renderManager.removeEventListenerFrom(elementId, 'mousedown'),
            renderManager.removeEventListenerFrom(indexHtmlIds.htmlId, 'mouseup')
        ]
        if (this.dragState) {
            pros.push(this.dragEnd(this.dragState.latest.mousePosition, this.dragState.latest.ctrlPressed))
        }
        await Promise.all(pros)
    }

    private dragStart(
        eventResult: MouseEventResultAdvanced,
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>,
        onDrag: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>,
        onDragEnd: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>
    ): void {
        if (this.dragState) {
            util.logWarning('MouseDownDragManager: there seem to be multiple elements that catch mousedown event at the same time or multiple mouse buttons are pressed.')
            return
        }
        this.dragState = {latest: {mousePosition: new ClientPosition(eventResult.clientX, eventResult.clientY), ctrlPressed: eventResult.ctrlPressed}, onDragEnd}

        renderManager.addEventListenerTo(indexHtmlIds.htmlId, 'mousemove', (clientX: number, clientY: number, ctrlPressed: boolean) => {
            this.drag(clientX, clientY, ctrlPressed, onDrag)
        }, RenderPriority.RESPONSIVE)
        onDragStart(eventResult)
    }

    private drag(
        clientX: number, clientY: number, ctrlPressed: boolean, 
        onDrag: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>
    ): void {
        if (!this.dragState) {
            return // this happens when mouseup was already fired but mousemove listener is not yet removed
        }
        this.dragState.latest = {mousePosition: new ClientPosition(clientX, clientY), ctrlPressed}

        onDrag(clientX, clientY, ctrlPressed)
    }

    private async dragEnd(position: ClientPosition, ctrlPressed: boolean): Promise<void> {
        if (!this.dragState) {
            return // this happens when unrelated mouseup events are fired anywhere in the app
        }
        
        await Promise.all([
            renderManager.removeEventListenerFrom(indexHtmlIds.htmlId, 'mousemove', RenderPriority.RESPONSIVE),
            this.dragState.onDragEnd(position.x, position.y, ctrlPressed),
            this.dragState = null
        ])
    }
}

mouseDownDragManager = new MouseDownDragManager()