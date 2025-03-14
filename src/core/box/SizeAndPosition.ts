import { LocalPosition } from '../shape/LocalPosition'
import { LocalRect } from '../LocalRect'
import { Box } from './Box'
import { RenderPriority, renderManager } from '../renderEngine/renderManager'
import { util } from '../util/util'
import { ClientRect } from '../ClientRect'
import { RootFolderBox } from './RootFolderBox'
import { log } from '../logService'
import { ClientPosition } from '../shape/ClientPosition'
import { style } from '../styleAdapter'

export class SizeAndPosition {
    /** html elements which width, height, left, top is too big fail to render */
    public static readonly delegateZoomToChildInPixels: number = 1000*1000 // TODO: can still be increased by magnitude when implementation is improved, worth it?

    public readonly referenceNode: Box // TODO: simply rename to parent?
    public readonly referenceNodeMapSiteData: {x: number, y: number, width: number, height: number} // reference to referenceNode.mapData TODO? simply call referenceNode.getMapData() every time?
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
        if (this.detached && !this.referenceNode.isRoot()) {
            if (measuresInPercentIfChanged.x) {
                this.detached.shiftX = measuresInPercentIfChanged.x - this.referenceNodeMapSiteData.x
            }
            if (measuresInPercentIfChanged.y) {
                this.detached.shiftY = measuresInPercentIfChanged.y - this.referenceNodeMapSiteData.y
            }
            if (measuresInPercentIfChanged.width) {
                this.detached.zoomX = measuresInPercentIfChanged.width / this.referenceNodeMapSiteData.width
            }
            if (measuresInPercentIfChanged.height) {
                this.detached.zoomY = measuresInPercentIfChanged.height / this.referenceNodeMapSiteData.height
            }
        } else {
            if (this.detached && this.referenceNode.isRoot()) {
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

    public async detachToFitClientRect(clientRect: ClientRect, options?: {transitionDurationInMS?: number, renderStylePriority?: RenderPriority}): Promise<void> {
        const rect: LocalRect = await this.referenceNode.getParent().transform.clientToLocalRect(clientRect)
        const savedRect: LocalRect = this.getLocalRectToSave()
        const zoom: number = Math.min(rect.width/savedRect.width, rect.height/savedRect.height)
        const fittedWidth: number = savedRect.width*zoom
        const fittedHeight: number = savedRect.height*zoom
        const rectMid: LocalPosition = rect.getMidPosition()

        this.detached = {
            shiftX: rectMid.percentX-fittedWidth/2 - savedRect.x,
            shiftY: rectMid.percentY-fittedHeight/2 - savedRect.y,
            zoomX: zoom,
            zoomY: zoom
        }

        const addingStyle: Promise<void> = renderManager.addClassTo(this.referenceNode.getId(), style.getBoxSiteDetachedClass(), options?.renderStylePriority)
        const {transitionAndRerender} = await this.referenceNode.renderStyleWithRerender(options)
        await transitionAndRerender
        await Promise.all([
            this.referenceNode.borderingLinks.renderAllThatShouldBe(),
            addingStyle
        ])
    }

    public async releaseIfDetached(options?: {transitionDurationInMS?: number, renderStylePriority?: RenderPriority}): Promise<void> {
        if (!this.detached) {
            return
        }

        this.detached = undefined

        const {transitionAndRerender} = await this.referenceNode.renderStyleWithRerender(options)
        await Promise.all([
            transitionAndRerender,
            this.referenceNode.borderingLinks.renderAllThatShouldBe(),
            renderManager.removeClassFrom(this.referenceNode.getId(), style.getBoxSiteDetachedClass(), options?.renderStylePriority)
        ])
    }

    public zoomToFit(options?: {animationIfAlreadyFitting?: boolean, transitionDurationInMS?: number}): Promise<void> {
        return this.zoomToFitRectIntern(new LocalRect(-5, -5, 110, 110), options)
    }

    public zoomToFitRect(rect: LocalRect, options?: {animationIfAlreadyFitting?: boolean, transitionDurationInMS?: number}): Promise<void> {
        const rectWithMargin = new LocalRect(
            rect.x - rect.width*0.05,
            rect.y - rect.height*0.05,
            rect.width*1.1,
            rect.height*1.1
        )
        return this.zoomToFitRectIntern(rectWithMargin, options)
    }

    private async zoomToFitRectIntern(rect: LocalRect, options?: {animationIfAlreadyFitting?: boolean, transitionDurationInMS?: number}): Promise<void> {
        if (!this.detached) {
            if (!this.referenceNode.isRoot()) {
                return this.referenceNode.getParent().site.zoomToFitRectIntern(this.referenceNode.transform.toParentRect(rect), options)
            }
            this.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            }
        }

        const transitionDurationInMS: number = options?.transitionDurationInMS ?? 500

        if (rect.width <= 0 || rect.height <= 0) {
            log.warning(`Site::zoomToFitRect(..) spatial rift detected, width is ${rect.width}, height is ${rect.height}.`)
        }

        const mapClientRect: ClientRect = await this.referenceNode.context.getMapClientRect()
        const mapRectInParentCoords: LocalRect = LocalRect.fromPositions(
            await this.referenceNode.transform.clientToParentLocalPosition(mapClientRect.getTopLeftPosition()),
            await this.referenceNode.transform.clientToParentLocalPosition(mapClientRect.getBottomRightPosition())
        )
        const rectInParentCoords: LocalRect = this.referenceNode.transform.toParentRect(rect)

        const factorX = mapRectInParentCoords.width / rectInParentCoords.width
        const factorY = mapRectInParentCoords.height / rectInParentCoords.height
        const factor: number = Math.min(factorX, factorY)

        const referenceBoxClientRect: ClientRect = await this.referenceNode.getClientRect()
        const wouldBeWidthInPixels: number = referenceBoxClientRect.width*factor
        const wouldBeHeightInPixels: number = referenceBoxClientRect.height*factor
        if (factor > 1 && (wouldBeWidthInPixels > SizeAndPosition.delegateZoomToChildInPixels || wouldBeHeightInPixels > SizeAndPosition.delegateZoomToChildInPixels)) {
            return this.delegateZoomToFitRectToChild(rect, options)
        } else if (!this.referenceNode.isRoot() && this.detached.zoomX*factor < 1 && this.detached.zoomY*factor < 1) {
            return this.delegateZoomToFitRectToParent(rect, {transitionDurationInMS, ...options})
        }

        const renderRect: LocalRect = this.getLocalRectToRender()
        const mapMidInParentCoords: LocalPosition = mapRectInParentCoords.getMidPosition()
        const rectOffsetXInParentCoords: number = rect.x * (renderRect.width/100) * factor
        const rectOffsetYInParentCoords: number = rect.y * (renderRect.height/100) * factor
        const shiftIncreaseX: number = mapMidInParentCoords.percentX - renderRect.x - rectInParentCoords.width*factor/2 - rectOffsetXInParentCoords
        const shiftIncreaseY: number = mapMidInParentCoords.percentY - renderRect.y - rectInParentCoords.height*factor/2 - rectOffsetYInParentCoords
        
        if (options?.animationIfAlreadyFitting && Math.abs(shiftIncreaseX) < 1 && Math.abs(shiftIncreaseY) < 1 && Math.abs(factor-1) < 0.01) {
            const deltaX = rect.width/100
            const deltaY = rect.height/100
            await this.zoomToFitRectIntern(new LocalRect(rect.x - deltaX, rect.y - deltaY, rect.width + deltaX*2, rect.height + deltaY*2), {transitionDurationInMS: transitionDurationInMS/2})
            await this.zoomToFitRectIntern(rect, {transitionDurationInMS: transitionDurationInMS/2})
            return
        }

        this.detached.shiftX += shiftIncreaseX
        this.detached.shiftY += shiftIncreaseY
        this.detached.zoomX *= factor
        this.detached.zoomY *= factor

        const renderStyleWithRerender = await this.referenceNode.renderStyleWithRerender({renderStylePriority: RenderPriority.RESPONSIVE, transitionDurationInMS})
        await renderStyleWithRerender.transitionAndRerender
    }

    private async delegateZoomToFitRectToChild(rect: LocalRect, options?: {animationIfAlreadyFitting?: boolean, transitionDurationInMS?: number}): Promise<void> {
        const childSite: SizeAndPosition|undefined = await this.findChildSiteToDelegateZoom()
        if (!childSite) {
            log.warning(`SizeAndPosition::delegateZoomToFitRectToChild(..) Deeper zoom not implemented for '${this.referenceNode.getName()}'.`)
            return
        }

        log.info(`Site::zoomToFitRect(..) delegating zoom to child '${childSite.referenceNode.getName()}'.`)
        if (childSite.detached) {
            log.warning('childSite is already detached')
        } else {
            childSite.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            }
        }
        // TODO finish mechanism that splits zoom for very big zoomSteps (so very small rects) but not an issue so far
        //if (wouldBeWidthInPixels > SizeAndPosition.delegateZoomToChildInPixels*5 || wouldBeHeightInPixels > SizeAndPosition.delegateZoomToChildInPixels*5) {
        //    if (!(wouldBeWidthInPixels > SizeAndPosition.delegateZoomToChildInPixels*10 || wouldBeHeightInPixels > SizeAndPosition.delegateZoomToChildInPixels*10)) {
                const rectInChildCoords: LocalRect = childSite.referenceNode.transform.fromParentRect(rect)
                return childSite.zoomToFitRectIntern(rectInChildCoords, options)
        //    } else {
        //        const delegationFactor: number = SizeAndPosition.delegateZoomToChildInPixels / Math.min(wouldBeWidthInPixels, wouldBeHeightInPixels)
        //        const widthChange: number = rect.width*delegationFactor - rect.width
        //        const heightChange: number = rect.height*delegationFactor - rect.height

        //        const delegationRectSize: number = 100/delegationFactor
        //        const delegationRectMidPosition: LocalPosition = rect.getMidPosition()
        //        const delegationRectMidPositionInChildCoords: LocalPosition = childSite.referenceNode.transform.fromParentPosition(delegationRectMidPosition)
        //        const delegationRect = new LocalRect(delegationRectMidPositionInChildCoords.percentX - delegationRectSize/2, delegationRectMidPositionInChildCoords.percentY - delegationRectSize/2, delegationRectSize, delegationRectSize)
        //        rect = new LocalRect(rect.x - widthChange/2, rect.y - heightChange/2, rect.width + widthChange, rect.height + heightChange)
        //        zoomingChild = childSite.zoomToFitRect(delegationRect, options)
        //    }
        //}
    }

    private async delegateZoomToFitRectToParent(rect: LocalRect, options?: {animationIfAlreadyFitting?: boolean, transitionDurationInMS?: number}): Promise<void> {
        log.info(`Site::zoomToFitRect(..) delegating zoom from '${this.referenceNode.getName()}' to parent.`)
        this.detached = undefined // important to unset unpinning before calling 'transform.toParentRect(rect)' because it should calculate with updated site
        const transitionDurationInMS: number|undefined = options?.transitionDurationInMS
        const rendering = this.referenceNode.renderStyleWithRerender({renderStylePriority: RenderPriority.RESPONSIVE, transitionDurationInMS})
        const zoomingParent = this.referenceNode.getParent().site.zoomToFitRectIntern(this.referenceNode.transform.toParentRect(rect), options)
        await (await rendering).transitionAndRerender
        await zoomingParent
        return
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
        await this.referenceNode.borderingLinks.renderAllThatShouldBe()
    }

    private async delegateZoomToChild(factor: number, positionInParentCoords: LocalPosition, childSiteToDelegateZoom?: SizeAndPosition): Promise<void> {
        if (!childSiteToDelegateZoom) {
            childSiteToDelegateZoom = await this.findChildSiteToDelegateZoom()
            if (!childSiteToDelegateZoom) {
                log.warning(`SizeAndPosition::delegateZoomToChild(..) Deeper zoom not implemented for '${this.referenceNode.getName()}'.`)
            }
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
        await this.referenceNode.borderingLinks.renderAllThatShouldBe()
    }

    private async findDetachedChildSite(): Promise<SizeAndPosition | undefined> {
        const renderedChildSite: SizeAndPosition|undefined = await this.findChildSiteToDelegateZoom()
        if (!renderedChildSite || !renderedChildSite.isDetached()) {
            return undefined
        }
        return renderedChildSite
    }

    private async findChildSiteToDelegateZoom(): Promise<SizeAndPosition | undefined> {
        const zoomedInChild: Box|undefined = await this.referenceNode.getZoomedInChild()
        return zoomedInChild?.site
    }
}