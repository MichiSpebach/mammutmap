import { MouseEventResultAdvanced, renderManager, RenderPriority } from './RenderManager'
import * as indexHtmlIds from './indexHtmlIds'
import { util } from './util'

export let mouseDownDragManager: MouseDownDragManager // = new MouseDownDragManager() // initialized at end of file

class MouseDownDragManager { // TODO: rename to MouseDownMoveManager?

    private mouseDown: boolean = false

    public async addDraggable(
        elementId: string,
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>,
        onDrag: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>,
        onDragEnd: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>
    ): Promise<void> {
        await Promise.all([
            renderManager.addEventListenerAdvancedTo(elementId, 'mousedown', (eventResult: MouseEventResultAdvanced) => {
                this.dragStart(eventResult, onDragStart, onDrag)
            }),
            renderManager.addEventListenerTo(indexHtmlIds.bodyId, 'mouseup', (clientX: number, clientY: number, ctrlPressed: boolean) => {
                // TODO: replace indexHtmlIds.bodyId with 'window' and only initialize once
                this.dragEnd(clientX, clientY, ctrlPressed, onDragEnd)
            }),
            renderManager.addEventListenerTo(indexHtmlIds.bodyId, 'mouseleave', (clientX: number, clientY: number, ctrlPressed: boolean) => {
                // TODO: remove when indexHtmlIds.bodyId is replaced with 'window'
                this.dragEnd(clientX, clientY, ctrlPressed, onDragEnd)
            })
        ])
    }

    public async removeDraggable(elementId: string): Promise<void> {
        await Promise.all([
            renderManager.removeEventListenerFrom(elementId, 'mousedown'),
            renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mouseup'), // TODO: replace indexHtmlIds.bodyId with 'window' and only initialize once
            renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mouseleave') // TODO: remove when indexHtmlIds.bodyId is replaced with 'window'
        ])
    }

    private dragStart(
        eventResult: MouseEventResultAdvanced,
        onDragStart: (eventResult: MouseEventResultAdvanced) => Promise<void>,
        onDrag: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>
    ): void {
        if (this.mouseDown) {
            util.logWarning('MouseDownDragManager: there seem to be multiple elements that catch mousedown event at the same time.')
        }
        this.mouseDown = true

        renderManager.addEventListenerTo(
            indexHtmlIds.bodyId, 'mousemove', // TODO: replace indexHtmlIds.bodyId with 'window'
            (clientX: number, clientY: number, ctrlPressed: boolean) => {this.drag(clientX, clientY, ctrlPressed, onDrag)}, 
            RenderPriority.RESPONSIVE
        )
        onDragStart(eventResult)
    }

    private drag(
        clientX: number, clientY: number, ctrlPressed: boolean, 
        onDrag: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>
    ): void {
        if (!this.mouseDown) {
            return // this happens when mouseup was already fired but mousemove listener is not yet removed
        }

        onDrag(clientX, clientY, ctrlPressed)
    }

    private dragEnd(
        clientX: number, clientY: number, ctrlPressed: boolean, 
        onDragEnd: (clientX: number, clientY: number, ctrlPressed: boolean) => Promise<void>
    ): void {
        if (!this.mouseDown) {
            return // this happens when unrelated mouseup events are fired anywhere in the app
        }
        this.mouseDown = false

        renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mousemove', RenderPriority.RESPONSIVE) // TODO: replace indexHtmlIds.bodyId with 'window'
        onDragEnd(clientX, clientY, ctrlPressed)
    }
}

mouseDownDragManager = new MouseDownDragManager()