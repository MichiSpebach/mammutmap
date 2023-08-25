import { LocalPosition } from '../shape/LocalPosition'
import { LocalRect } from '../LocalRect'
import { Box } from './Box'
import { RenderPriority, renderManager } from '../RenderManager'
import { util } from '../util/util'
import { ClientRect } from '../ClientRect'
import { RootFolderBox } from './RootFolderBox'
import { log } from '../logService'
import { ClientPosition } from '../shape/ClientPosition'

export class SizeAndPosition {
    /** html elements which width, height, left, top is too big fail to render */
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

    public zoomToFit(options?: {animationIfAlreadyFitting?: boolean, transitionDurationInMS?: number}): Promise<void> {
        return this.zoomToFitRect(new LocalRect(0, 0, 100, 100), options)
    }

    public async zoomToFitRect(rect: LocalRect, options?: {animationIfAlreadyFitting?: boolean, transitionDurationInMS?: number}): Promise<void> {
        if (false) {
            return this.zoomToFitClientRect(await this.referenceNode.transform.localToClientRect(rect), options)
        }

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

        if (rect.width <= 0 || rect.height <= 0) {
            log.warning(`Site::zoomToFitRect(..) spatial rift detected, width is ${rect.width}, height is ${rect.height}.`)
        }

        const transitionDurationInMS: number = options?.transitionDurationInMS ?? 500
        
        const saveRect: LocalRect = this.getLocalRectToSave()
        const renderRect: LocalRect = this.getLocalRectToRender()
        const effectiveRect = this.referenceNode.isRoot()
            ? rect//await this.enlargeRectInMapRatioAdjusterCoordsToFillMap(rect)
            : rect
        log.info(`effectiveRect ${util.stringify(effectiveRect)}`)
        log.info(`saveRect ${util.stringify(saveRect)}`)
        log.info(`renderRect ${util.stringify(renderRect)}`)

        const mapClientRect: ClientRect = await this.referenceNode.context.getMapClientRect()

        let mapRectInParentCoords: LocalRect
        let rectInParentCoords: LocalRect
        if (this.referenceNode.isRoot()) {
            mapRectInParentCoords = LocalRect.fromPositions(
                await this.referenceNode.transform.clientToLocalPosition(mapClientRect.getTopLeftPosition()),
                await this.referenceNode.transform.clientToLocalPosition(mapClientRect.getBottomRightPosition())
            )
            rectInParentCoords = rect
        } else {
            mapRectInParentCoords = LocalRect.fromPositions(
                await this.referenceNode.transform.clientToParentLocalPosition(mapClientRect.getTopLeftPosition()),
                await this.referenceNode.transform.clientToParentLocalPosition(mapClientRect.getBottomRightPosition())
            )
            rectInParentCoords = LocalRect.fromPositions(
               this.referenceNode.transform.toParentPosition(rect.getTopLeftPosition()),
               this.referenceNode.transform.toParentPosition(rect.getBottomRightPosition())
           )
        }

        log.info(`mapClientRect=${util.stringify(mapClientRect)}`)
        log.info(`mapRectInParentCoords=${util.stringify(mapRectInParentCoords)}`)
        log.info(`rectInParentCoords=${util.stringify(rectInParentCoords)}`)

        //const zoom = 100 / Math.max(effectiveRect.width, effectiveRect.height)
        const zoomX = mapRectInParentCoords.width / rectInParentCoords.width
        const zoomY = mapRectInParentCoords.height / rectInParentCoords.height
        const zoom = Math.min(zoomX, zoomY)

        let offsetToCenterX: number = 0
        let offsetToCenterY: number = 0
        if (effectiveRect.width < effectiveRect.height) {
            offsetToCenterX = (effectiveRect.height-effectiveRect.width)/2
        } else {
            offsetToCenterY = (effectiveRect.width-effectiveRect.height)/2
        }

        const referenceBoxClientRect: ClientRect = await this.referenceNode.getClientRect()
        const wouldBeWidthInPixels: number = referenceBoxClientRect.width*zoom
        const wouldBeHeightInPixels: number = referenceBoxClientRect.height*zoom
        log.info(`boxName=${this.referenceNode.getName()}, wouldbeWidthInPixels=${wouldBeWidthInPixels}`)
        let zoomingChild: Promise<void>|undefined = undefined
        if (wouldBeWidthInPixels > SizeAndPosition.delegateZoomToChildInPixels || wouldBeHeightInPixels > SizeAndPosition.delegateZoomToChildInPixels) {
            /*log.info(`Site::zoomToFitRect(..) delegateZoomToChild from '${this.referenceNode.getName()}' '${rect.width}' '${rect.height}`)
            const delegationFactor: number = minSize / Math.min(rect.width, rect.height)
            const widthChange: number = rect.width*delegationFactor - rect.width
            const heightChange: number = rect.height*delegationFactor - rect.height

            const originalRect: LocalRect = rect
            rect = new LocalRect(rect.x - widthChange/2, rect.y - heightChange/2, rect.width + widthChange, rect.height + heightChange)*/
            
            const childSite: SizeAndPosition|undefined = await this.findChildSiteToDelegateZoom()
            if (childSite) {
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
                const rectInChildCoords: LocalRect = LocalRect.fromPositions(
                    childSite.referenceNode.transform.fromParentPosition(rect.getTopLeftPosition()),
                    childSite.referenceNode.transform.fromParentPosition(rect.getBottomRightPosition())
                )
                return childSite.zoomToFitRect(rectInChildCoords, options)
                /*const delegationRectSize: number = 100/delegationFactor
                const delegationRectMidPosition: LocalPosition = originalRect.getMidPosition()
                const delegationRectMidPositionInChildCoords: LocalPosition = childSite.referenceNode.transform.fromParentPosition(delegationRectMidPosition)
                const delegationRect = new LocalRect(delegationRectMidPositionInChildCoords.percentX - delegationRectSize/2, delegationRectMidPositionInChildCoords.percentY - delegationRectSize/2, delegationRectSize, delegationRectSize)
                return zoomingChild = childSite.zoomToFitRect(delegationRect, options)*/
            }
        }

        let mapMidInParentCoords: LocalPosition = mapRectInParentCoords.getMidPosition()
        const newWidth: number = saveRect.width*zoom
        const newHeight: number = saveRect.height*zoom
        log.info(`mapMidInParentCoords=${util.stringify(mapMidInParentCoords)}`)
        let distanceToMapMidInParentCoordsX: number = mapMidInParentCoords.percentX - rectInParentCoords.x - rectInParentCoords.width*zoom/2
        let distanceToMapMidInParentCoordsY: number = mapMidInParentCoords.percentY - rectInParentCoords.y - rectInParentCoords.height*zoom/2
        if (this.referenceNode.isRoot()) {
            //distanceToMapMidInParentCoordsX = -this.detached.shiftX - this.detached.zoomX*zoom*(saveRect.width/100)*(effectiveRect.x-offsetToCenterX) - saveRect.x - (saveRect.width-100)/2
            //distanceToMapMidInParentCoordsY = -this.detached.shiftY - this.detached.zoomY*zoom*(saveRect.height/100)*(effectiveRect.y-offsetToCenterY) - saveRect.y - (saveRect.height-100)/2
            distanceToMapMidInParentCoordsX = -this.detached.shiftX - this.detached.zoomX*zoom*(saveRect.width/100)*(effectiveRect.x) - saveRect.x - (saveRect.width-100)/2
            distanceToMapMidInParentCoordsY = -this.detached.shiftY - this.detached.zoomY*zoom*(saveRect.height/100)*(effectiveRect.y) - saveRect.y - (saveRect.height-100)/2
        }

        const newDetached = {
            //shiftX: -zoom*(saveRect.width/100)*(effectiveRect.x-offsetToCenterX),
            //shiftY: -zoom*(saveRect.height/100)*(effectiveRect.y-offsetToCenterY),
            //shiftX: -zoom*(saveRect.width/100)*(effectiveRect.x-offsetToCenterX) - saveRect.x - (saveRect.width-100)/2,
            //shiftY: -zoom*(saveRect.height/100)*(effectiveRect.y-offsetToCenterY) - saveRect.y - (saveRect.height-100)/2,
            //shiftX: - saveRect.x + mapMidInParentCoords.percentX - newWidth/2,
            //shiftY: - saveRect.y + mapMidInParentCoords.percentY - newHeight/2,
            //shiftX: this.detached.shiftX - saveRect.x + mapMidInParentCoords.percentX - newWidth/2,
            //shiftY: this.detached.shiftY - saveRect.y + mapMidInParentCoords.percentY - newHeight/2,
            shiftX: this.detached.shiftX + distanceToMapMidInParentCoordsX,
            shiftY: this.detached.shiftY + distanceToMapMidInParentCoordsY,
            zoomX: this.detached.zoomX * zoom,
            zoomY: this.detached.zoomY * zoom
            //zoomX: zoom,
            //zoomY: zoom
        }

        const deltas: {shiftX: number, shiftY: number, zoom: number} = await this.calculateZoomToFitRectDeltas(rect)
        console.log(util.stringify(deltas))
        
        if (options?.animationIfAlreadyFitting && Math.abs(deltas.shiftX) < 1 && Math.abs(deltas.shiftY) < 1 && Math.abs(deltas.zoom-1) < 0.01) {
            const deltaX = rect.width/100
            const deltaY = rect.height/100
            await this.zoomToFitRect(new LocalRect(rect.x - deltaX, rect.y - deltaY, rect.width + deltaX*2, rect.height + deltaY*2), {transitionDurationInMS: transitionDurationInMS/2})
            await this.zoomToFitRect(rect, {transitionDurationInMS: transitionDurationInMS/2})
            return
        }

        this.detached.shiftX += deltas.shiftX
        this.detached.shiftY += deltas.shiftY
        this.detached.zoomX *= deltas.zoom
        this.detached.zoomY *= deltas.zoom

        const renderStyleWithRerender = await this.referenceNode.renderStyleWithRerender({renderStylePriority: RenderPriority.RESPONSIVE, transitionDurationInMS})
        await renderStyleWithRerender.transitionAndRerender
        if (zoomingChild) {
            await zoomingChild
        }
    }

    private async calculateZoomToFitRectDeltas(rect: LocalRect): Promise<{shiftX: number, shiftY: number, zoom: number}> {
        if (!this.detached) {
            log.warning(`Site::calculateZoomToFitRectDeltas(..) referenceNode '${this.referenceNode.getName()}' is not detached/unpinned.`)
            return {shiftX: 0, shiftY: 0, zoom: 1}
        }

        const saveRect: LocalRect = this.getLocalRectToSave()
        const renderRect: LocalRect = this.getLocalRectToRender()
        const effectiveRect = this.referenceNode.isRoot()
            ? rect//await this.enlargeRectInMapRatioAdjusterCoordsToFillMap(rect)
            : rect
        log.info(`effectiveRect ${util.stringify(effectiveRect)}`)
        log.info(`saveRect ${util.stringify(saveRect)}`)
        log.info(`renderRect ${util.stringify(renderRect)}`)

        const mapClientRect: ClientRect = await this.referenceNode.context.getMapClientRect()
        
        const mapRectInParentCoords: LocalRect = LocalRect.fromPositions(
            await this.referenceNode.transform.clientToParentLocalPosition(mapClientRect.getTopLeftPosition()),
            await this.referenceNode.transform.clientToParentLocalPosition(mapClientRect.getBottomRightPosition())
        )
        const rectInParentCoords: LocalRect = LocalRect.fromPositions(
            this.referenceNode.transform.toParentPosition(rect.getTopLeftPosition()),
            this.referenceNode.transform.toParentPosition(rect.getBottomRightPosition())
        )

        log.info(`mapClientRect=${util.stringify(mapClientRect)}`)
        log.info(`mapRectInParentCoords=${util.stringify(mapRectInParentCoords)}`)
        log.info(`rectInParentCoords=${util.stringify(rectInParentCoords)}`)

        const zoomX = mapRectInParentCoords.width / rectInParentCoords.width
        const zoomY = mapRectInParentCoords.height / rectInParentCoords.height
        let zoom: number
        if (!true && this.referenceNode.isRoot()) {
            zoom = 100 / Math.max(effectiveRect.width, effectiveRect.height) / this.detached.zoomX
        } else {
            zoom = Math.min(zoomX, zoomY)
        }

        let offsetToCenterX: number = 0
        let offsetToCenterY: number = 0
        if (effectiveRect.width < effectiveRect.height) {
            offsetToCenterX = (effectiveRect.height-effectiveRect.width)/2
        } else {
            offsetToCenterY = (effectiveRect.width-effectiveRect.height)/2
        }

        const referenceBoxClientRect: ClientRect = await this.referenceNode.getClientRect()

        let mapMidInParentCoords: LocalPosition = mapRectInParentCoords.getMidPosition()
        const newWidth: number = saveRect.width*zoom
        const newHeight: number = saveRect.height*zoom
        log.info(`mapMidInParentCoords=${util.stringify(mapMidInParentCoords)}`)
        if (!true && this.referenceNode.isRoot()) {
            return {
                shiftX: -this.detached.shiftX - this.detached.zoomX*zoom*(saveRect.width/100)*(effectiveRect.x) - saveRect.x - (saveRect.width-100)/2,
                shiftY: -this.detached.shiftY - this.detached.zoomY*zoom*(saveRect.height/100)*(effectiveRect.y) - saveRect.y - (saveRect.height-100)/2,
                zoom
            }
        } else {
            log.info(`rectInParentCoords.y ${rectInParentCoords.y}`)
            const rectOffsetXInParentCoords: number = rect.x * (renderRect.width/100) * zoom
            const rectOffsetYInParentCoords: number = rect.y * (renderRect.height/100) * zoom
            return {
                //shiftX: mapMidInParentCoords.percentX - rectInParentCoords.x - rectInParentCoords.width*zoom/2,
                //shiftY: mapMidInParentCoords.percentY - rectInParentCoords.y - rectInParentCoords.height*zoom/2,
                //shiftX: mapMidInParentCoords.percentX - rectInParentCoords.x - rectInParentCoords.width*zoom/2 - saveRect.x,
                //shiftY: mapMidInParentCoords.percentY - rectInParentCoords.y - rectInParentCoords.height*zoom/2 - saveRect.y,
                shiftX: mapMidInParentCoords.percentX - renderRect.x - rectInParentCoords.width*zoom/2 - rectOffsetXInParentCoords,
                shiftY: mapMidInParentCoords.percentY - renderRect.y - rectInParentCoords.height*zoom/2 - rectOffsetYInParentCoords,
                zoom
            }
        }
    }

    public async zoomToFitClientRect(rect: ClientRect, options?: {animationIfAlreadyFitting?: boolean, transitionDurationInMS?: number}): Promise<void> {
        if (!this.detached) {
            if (!this.referenceNode.isRoot()) {
                return this.referenceNode.getParent().site.zoomToFitClientRect(rect, options)
            }
            this.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            }
        }

        if (rect.width <= 0 || rect.height <= 0) {
            log.warning(`Site::zoomToFitRect(..) spatial rift detected, width is ${rect.width}, height is ${rect.height}.`)
        }

        const mapClientRect: ClientRect = await this.referenceNode.context.getMapClientRect()
        const mapMidPosition: ClientPosition = mapClientRect.getMidPosition()
        const zoomX: number = mapClientRect.width / rect.width
        const zoomY: number = mapClientRect.height / rect.height
        const zoom: number = Math.min(zoomX, zoomY) / 2

        const parentClientRect: ClientRect = await this.referenceNode.getParentClientRect()
        const shiftX: number = rect.x / (parentClientRect.width/100)
        const shiftY: number = rect.y / (parentClientRect.height/100)

        const newDetached = {
            shiftX: this.detached.shiftX - shiftX/**rectTopLeftPositionInLocalCoords.percentX (positionInParentCoords.percentX - renderRect.x)*/,
            shiftY: this.detached.shiftY - shiftY,
            zoomX: this.detached.zoomX * zoom,
            zoomY: this.detached.zoomY * zoom
        }

        this.detached = newDetached
        const renderStyleWithRerender = await this.referenceNode.renderStyleWithRerender({renderStylePriority: RenderPriority.RESPONSIVE, transitionDurationInMS: 500})
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
                // TODO: remove options and log warning where called
                log.warning('SizeAndPosition::findChildSiteToDelegateZoom(..) Deeper zoom not implemented.')
            }
            return undefined
        }
        return zoomedInChild.site
    }
}