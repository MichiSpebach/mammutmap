import { LocalPosition } from '../shape/LocalPosition'
import { LocalRect } from '../LocalRect'
import { Box } from './Box'
import { RenderPriority } from '../RenderManager'

export class SizeAndPosition {
    private readonly referenceNode: Box // TODO: simply rename to parent?
    private detached: {
        shiftX: number
        shiftY: number
        zoomX: number
        zoomY: number
    } | undefined

    public constructor(referenceNode: Box) {
        this.referenceNode = referenceNode
    }

    public isDetached(): boolean {
        return !!this.detached
    }

    public getDetached(): Readonly<{
        shiftX: number
        shiftY: number
        zoomX: number
        zoomY: number
    }> | undefined {
        return this.detached
    }

    public getLocalRectToRender(): LocalRect {
        const savedRect: LocalRect = this.getLocalRectToSave()
        if (this.detached) {
            return new LocalRect(
                savedRect.x + this.detached.shiftX,
                savedRect.y + this.detached.shiftY,
                savedRect.width * this.detached.zoomX,
                savedRect.height * this.detached.zoomY
            )
        }
        return savedRect
    }

    public getLocalRectToSave(): LocalRect {
        return this.referenceNode.getLocalRectToSave()
    }

    public async zoom(factor: number, position: LocalPosition): Promise<void> {
        if (!this.detached) {
            this.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            }
        }
        const positionInParentCoords = this.referenceNode.transform.toParentPosition(position)
        const renderRect: LocalRect = this.getLocalRectToRender()
    
        this.detached.shiftX -= (factor-1) * (positionInParentCoords.percentX - renderRect.x)
        this.detached.shiftY -= (factor-1) * (positionInParentCoords.percentY - renderRect.y)
        this.detached.zoomX *= factor
        this.detached.zoomY *= factor

        await this.referenceNode.renderStyle(RenderPriority.RESPONSIVE)
        await this.referenceNode.render()
    }

    public async shift(x: number, y: number): Promise<void> {
        if (!this.detached) {
            this.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            }
        }

        this.detached.shiftX += x
        this.detached.shiftY += y

        await this.referenceNode.renderStyle(RenderPriority.RESPONSIVE)
        await this.referenceNode.render()
    }
}