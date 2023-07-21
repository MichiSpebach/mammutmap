import { LocalPosition } from '../shape/LocalPosition'
import { LocalRect } from '../LocalRect'
import { Box } from './Box'
import { RenderPriority, renderManager } from '../RenderManager'
import { util } from '../util/util'
import { ClientRect } from '../ClientRect'
import { RootFolderBox } from './RootFolderBox'
import { log } from '../logService'

export class SizeAndPosition {
    public static readonly delegateZoomToChildInPixels: number = 1000*1000 // TODO: can still be increased by magnitude when implementation is improved, worth it?

    public readonly referenceNode: Box // TODO: simply rename to parent?
    public readonly referenceNodeMapSiteData: {x: number, y: number, width: number, height: number}
    private detached: { // TODO: rename to unhinged or unpinned?
        shiftX: number
        shiftY: number
        zoomX: number
        zoomY: number
    } | undefined

    public constructor(referenceNode: Box, referenceNodeMapSiteData: {x: number, y: number, width: number, height: number}) {
        this.referenceNode = referenceNode
        this.referenceNodeMapSiteData = referenceNodeMapSiteData
    }

    public isDetached(): boolean {
        return !!this.detached
    }

    public async getDetachmentsInRenderedPath(): Promise<Readonly<{
        shiftX: number
        shiftY: number
        zoomX: number
        zoomY: number
    }>[]> {
        return (await this.getDetachedRenderedPath()).map(site => {
            if (!site.detached) {
                util.logWarning('SizeAndPosition::getDetachmentsInRenderedPath() expected site to be detached')
            }
            return site.detached!
        })
    }

    public async getDetachedRenderedPath(): Promise<SizeAndPosition[]> {
        return (await this.referenceNode.getZoomedInPath()).map(box => box.site).filter(site => site.detached)
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

    public async updateMeasures(
        measuresInPercentIfChanged: {x?: number, y?: number, width?: number, height?: number},
        priority: RenderPriority = RenderPriority.NORMAL
    ): Promise<void> {
        if (this.detached) {
            if (!this.referenceNode.isRoot()) {
                util.logWarning(`SizeAndPosition::updateMeasures(..) not implemented on detached box "${this.referenceNode.getName()}".`)
                return
            }
            measuresInPercentIfChanged = this.transformDetachedMeasuresToMeasuresToSave(measuresInPercentIfChanged)
        }
    
        if (measuresInPercentIfChanged.x != null) {
            this.referenceNodeMapSiteData.x = measuresInPercentIfChanged.x
        }
        if (measuresInPercentIfChanged.y != null) {
            this.referenceNodeMapSiteData.y = measuresInPercentIfChanged.y
        }
        if (measuresInPercentIfChanged.width != null) {
            this.referenceNodeMapSiteData.width = measuresInPercentIfChanged.width
        }
        if (measuresInPercentIfChanged.height != null) {
            this.referenceNodeMapSiteData.height = measuresInPercentIfChanged.height
        }
    
        await this.referenceNode.renderStyleWithRerender({renderStylePriority: priority}) // TODO: add 'rerenderPriority: RenderPriority.LOW' with very low priority and
        // TODO: return '{renderStyle: Promise<void>, rerenderChilds: Promise<void>}> to prevent rerenderChilds from blocking rerenderBorderingLinks in Box
    }

    private transformDetachedMeasuresToMeasuresToSave(
        measuresInPercentIfChanged: {x?: number, y?: number, width?: number, height?: number}
    ): {x?: number, y?: number, width?: number, height?: number} {
        if (!this.detached) {
            util.logWarning(`expected SizeAndPosition::transformDetachedMeasuresToMeasuresToSave(..) to be called on detached box "${this.referenceNode.getName()}".`)
            return measuresInPercentIfChanged
        }

        if (measuresInPercentIfChanged.x) {
            measuresInPercentIfChanged.x -= this.detached.shiftX
        }
        if (measuresInPercentIfChanged.y) {
            measuresInPercentIfChanged.y -= this.detached.shiftY
        }
        if (measuresInPercentIfChanged.width) {
            measuresInPercentIfChanged.width /= this.detached.zoomX
        }
        if (measuresInPercentIfChanged.height) {
            measuresInPercentIfChanged.height /= this.detached.zoomY
        }
        return measuresInPercentIfChanged
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

        await this.referenceNode.renderStyleWithRerender({renderStylePriority: RenderPriority.RESPONSIVE})
    }

    public zoomToFit(options?: {animationIfAlreadyFitting?: boolean}): Promise<void> {
        return this.zoomToFitRect(new LocalRect(0, 0, 100, 100), options)
    }

    public async zoomToFitRect(rect: LocalRect, options?: {animationIfAlreadyFitting?: boolean, transitionDurationInMS?: number}): Promise<void> {
        if (!this.detached) {
            if (!this.referenceNode.isRoot()) {
                const topLeftInParentCoords: LocalPosition = this.referenceNode.transform.toParentPosition(rect.getTopLeftPosition())
                const bottomRightInParentCoords: LocalPosition = this.referenceNode.transform.toParentPosition(rect.getBottomRightPosition())
                return this.referenceNode.getParent().site.zoomToFitRect(LocalRect.fromPositions(topLeftInParentCoords, bottomRightInParentCoords), options)
            }
            this.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            }
        }
        const transitionDurationInMS: number = options?.transitionDurationInMS ?? 500
        
        const saveRect: LocalRect = this.getLocalRectToSave()
        const effectiveRect = this.referenceNode.isRoot()
            ? await this.enlargeRectInMapRatioAdjusterCoordsToFillMap(rect)
            : rect
        const zoom = 100 / Math.max(effectiveRect.width, effectiveRect.height)
    
        // TODO IMPORTANT: implement delegate mechanism for large values

        let offsetToCenterX: number = 0
        let offsetToCenterY: number = 0
        if (effectiveRect.width < effectiveRect.height) {
            offsetToCenterX = (effectiveRect.height-effectiveRect.width)/2
        } else {
            offsetToCenterY = (effectiveRect.width-effectiveRect.height)/2
        }

        const newDetached = {
            shiftX: -zoom*(saveRect.width/100)*(effectiveRect.x-offsetToCenterX) - saveRect.x - (saveRect.width-100)/2,
            shiftY: -zoom*(saveRect.height/100)*(effectiveRect.y-offsetToCenterY) - saveRect.y - (saveRect.height-100)/2,
            zoomX: zoom,
            zoomY: zoom
        }
        
        if (options?.animationIfAlreadyFitting &&
            Math.abs(newDetached.shiftX-this.detached.shiftX) < 1 &&
            Math.abs(newDetached.shiftY-this.detached.shiftY) < 1 &&
            Math.abs(newDetached.zoomX-this.detached.zoomX) < 1 &&
            Math.abs(newDetached.zoomY-this.detached.zoomY) < 1
        ) {
            const deltaX = rect.width/100
            const deltaY = rect.height/100
            await this.zoomToFitRect(new LocalRect(rect.x - deltaX, rect.y - deltaY, rect.width + deltaX*2, rect.height + deltaY*2), {transitionDurationInMS: transitionDurationInMS/2})
            await this.zoomToFitRect(rect, {transitionDurationInMS: transitionDurationInMS/2})
            return
        }

        this.detached = newDetached
        const renderStyleWithRerender = await this.referenceNode.renderStyleWithRerender({renderStylePriority: RenderPriority.RESPONSIVE, transitionDurationInMS})
        await renderStyleWithRerender.transitionAndRerender
    }

    // TODO: this is a hack implement better solution
    private async enlargeRectInMapRatioAdjusterCoordsToFillMap(rect: LocalRect): Promise<LocalRect> {
        const mapClientRect: ClientRect = await this.referenceNode.context.getMapClientRect()
        const mapRatio: number =  mapClientRect.width/mapClientRect.height
        return new LocalRect(rect.x + (rect.width - rect.width/mapRatio)/2, rect.y, rect.width/mapRatio, rect.height)
    }

    public async zoom(factor: number, position: LocalPosition): Promise<void> {
        await this.zoomInParentCoords(factor, this.referenceNode.transform.toParentPosition(position))
    }

    public async zoomInParentCoords(factor: number, positionInParentCoords: LocalPosition): Promise<void> {
        if (!this.detached) {
            this.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            }
        }

        const childSiteToDelegateZoom: SizeAndPosition|undefined = await this.findDetachedChildSite() // TODO: cache?, small lags appear while zooming on heavy load, this could be why, did not recognize them before
        if (childSiteToDelegateZoom) {
            return this.delegateZoomToChild(factor, positionInParentCoords, childSiteToDelegateZoom)
        }

        if (factor > 1) {
            const pixelRect: ClientRect = await this.referenceNode.getClientRect() // TODO: do this after zooming, init detachment in child for next zoom?
            // TODO: small lags appear while zooming on heavy load, this could be why, did not recognize them before
            // TODO: or check with new detached values in case of very big zoom factor?
            const maxPixels: number = SizeAndPosition.delegateZoomToChildInPixels
            if (pixelRect.x < -maxPixels || pixelRect.y < -maxPixels || pixelRect.width > maxPixels || pixelRect.height > maxPixels) {
                util.logInfo('SizeAndPosition::delegateZoomToChild(..)')
                return this.delegateZoomToChild(factor, positionInParentCoords)
            }
        }

        if (factor < 1 
            && !this.referenceNode.isRoot() 
            && (this.detached.shiftX > 0 && this.detached.shiftY > 0 && this.detached.zoomX < 1 && this.detached.zoomY < 1)
        ) {
            util.logInfo('SizeAndPosition::delegateZoomToParent(..)')
            return this.delegateZoomToParent(factor, positionInParentCoords)
        }

        const renderRect: LocalRect = this.getLocalRectToRender()
    
        this.detached.shiftX -= (factor-1) * (positionInParentCoords.percentX - renderRect.x)
        this.detached.shiftY -= (factor-1) * (positionInParentCoords.percentY - renderRect.y)
        this.detached.zoomX *= factor
        this.detached.zoomY *= factor

        await this.referenceNode.renderStyle(RenderPriority.RESPONSIVE)
        await this.referenceNode.render()
    }

    private async delegateZoomToChild(factor: number, positionInParentCoords: LocalPosition, childSiteToDelegateZoom?: SizeAndPosition): Promise<void> {
        if (!childSiteToDelegateZoom) {
            childSiteToDelegateZoom = await this.findChildSiteToDelegateZoom()
        }
        return childSiteToDelegateZoom?.zoomInParentCoords(factor, this.referenceNode.transform.fromParentPosition(positionInParentCoords))
    }

    private async delegateZoomToParent(factor: number, positionInParentCoords: LocalPosition): Promise<void> {
        if (!this.detached) {
            util.logWarning(`SizeAndPosition::delegateZoomToParent(..) called when not detached.`)
            return
        }
        const parentSite: SizeAndPosition = this.referenceNode.getParent().site
        if (!parentSite.detached) {
            util.logWarning(`SizeAndPosition::delegateZoomToParent(..) expected parent of detached box "${this.referenceNode.getName()}" do be detached as well while zooming.`)
            return
        }

        const position: LocalPosition = this.referenceNode.transform.fromParentPosition(positionInParentCoords) // store in local because relation to parent changes

        const parentRect: LocalRect = this.referenceNode.getParent().site.getLocalRectToRender()
        const localRect: LocalRect = this.getLocalRectToRender()
        const localRectCenter: LocalPosition = new LocalPosition(localRect.x + localRect.width/2, localRect.y + localRect.height/2)
        const localRectCenterInParentCoords: LocalPosition = this.referenceNode.getParent().transform.toParentPosition(localRectCenter)
        
        const wouldBeShiftXWhenCentered: number = -(this.detached.zoomX-1) * this.getLocalRectToSave().width/2
        const wouldBeShiftYWhenCentered: number = -(this.detached.zoomY-1) * this.getLocalRectToSave().height/2
        const shiftXDistanceFromWouldBeCentered: number = this.detached.shiftX - wouldBeShiftXWhenCentered
        const shiftYDistanceFromWouldBeCentered: number = this.detached.shiftY - wouldBeShiftYWhenCentered
        
        parentSite.detached.shiftX += shiftXDistanceFromWouldBeCentered * this.detached.zoomX * parentRect.width/100
        parentSite.detached.shiftY += shiftYDistanceFromWouldBeCentered * this.detached.zoomY * parentRect.height/100

        parentSite.detached.shiftX -= (this.detached.zoomX-1) * (localRectCenterInParentCoords.percentX - parentRect.x)
        parentSite.detached.shiftY -= (this.detached.zoomY-1) * (localRectCenterInParentCoords.percentY - parentRect.y)
        parentSite.detached.zoomX *= this.detached.zoomX
        parentSite.detached.zoomY *= this.detached.zoomY

        this.detached = undefined

        await Promise.all([
            this.referenceNode.renderStyle(RenderPriority.RESPONSIVE),
            this.referenceNode.getParent().site.zoom(factor, this.referenceNode.transform.toParentPosition(position))
        ])
    }

    private async findDetachedChildSite(): Promise<SizeAndPosition | undefined> {
        const renderedChildSite: SizeAndPosition|undefined = await this.findChildSiteToDelegateZoom({warningOff: true})
        if (!renderedChildSite || !renderedChildSite.isDetached()) {
            return undefined
        }
        return renderedChildSite
    }

    private async findChildSiteToDelegateZoom(options?: {warningOff?: boolean}): Promise<SizeAndPosition | undefined> {
        const zoomedInChild: Box|undefined = await this.referenceNode.getZoomedInChild()
        if (!zoomedInChild) {
            if (!options?.warningOff) {
                log.warning('SizeAndPosition::findChildSiteToDelegateZoom(..) Deeper zoom not implemented.')
            }
            return undefined
        }
        return zoomedInChild.site
    }
}