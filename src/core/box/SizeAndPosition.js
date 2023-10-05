"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SizeAndPosition = void 0;
const LocalPosition_1 = require("../shape/LocalPosition");
const LocalRect_1 = require("../LocalRect");
const RenderManager_1 = require("../RenderManager");
const util_1 = require("../util/util");
const logService_1 = require("../logService");
class SizeAndPosition {
    constructor(referenceNode, referenceNodeMapSiteData) {
        this.referenceNode = referenceNode;
        this.referenceNodeMapSiteData = referenceNodeMapSiteData;
    }
    isDetached() {
        return !!this.detached;
    }
    async getDetachmentsInRenderedPath() {
        return (await this.getDetachedRenderedPath()).map(site => {
            if (!site.detached) {
                util_1.util.logWarning('SizeAndPosition::getDetachmentsInRenderedPath() expected site to be detached');
            }
            return site.detached;
        });
    }
    async getDetachedRenderedPath() {
        return (await this.referenceNode.getZoomedInPath()).map(box => box.site).filter(site => site.detached);
    }
    getLocalRectToRender() {
        const savedRect = this.getLocalRectToSave();
        if (this.detached) {
            return new LocalRect_1.LocalRect(savedRect.x + this.detached.shiftX, savedRect.y + this.detached.shiftY, savedRect.width * this.detached.zoomX, savedRect.height * this.detached.zoomY);
        }
        return savedRect;
    }
    getLocalRectToSave() {
        return this.referenceNode.getLocalRectToSave();
    }
    async updateMeasures(measuresInPercentIfChanged, priority = RenderManager_1.RenderPriority.NORMAL) {
        if (this.detached) {
            if (!this.referenceNode.isRoot()) {
                util_1.util.logWarning(`SizeAndPosition::updateMeasures(..) not implemented on detached box "${this.referenceNode.getName()}".`);
                return;
            }
            measuresInPercentIfChanged = this.transformDetachedMeasuresToMeasuresToSave(measuresInPercentIfChanged);
        }
        if (measuresInPercentIfChanged.x != null) {
            this.referenceNodeMapSiteData.x = measuresInPercentIfChanged.x;
        }
        if (measuresInPercentIfChanged.y != null) {
            this.referenceNodeMapSiteData.y = measuresInPercentIfChanged.y;
        }
        if (measuresInPercentIfChanged.width != null) {
            this.referenceNodeMapSiteData.width = measuresInPercentIfChanged.width;
        }
        if (measuresInPercentIfChanged.height != null) {
            this.referenceNodeMapSiteData.height = measuresInPercentIfChanged.height;
        }
        await this.referenceNode.renderStyleWithRerender({ renderStylePriority: priority }); // TODO: add 'rerenderPriority: RenderPriority.LOW' with very low priority and
        // TODO: return '{renderStyle: Promise<void>, rerenderChilds: Promise<void>}> to prevent rerenderChilds from blocking rerenderBorderingLinks in Box
    }
    transformDetachedMeasuresToMeasuresToSave(measuresInPercentIfChanged) {
        if (!this.detached) {
            util_1.util.logWarning(`expected SizeAndPosition::transformDetachedMeasuresToMeasuresToSave(..) to be called on detached box "${this.referenceNode.getName()}".`);
            return measuresInPercentIfChanged;
        }
        if (measuresInPercentIfChanged.x) {
            measuresInPercentIfChanged.x -= this.detached.shiftX;
        }
        if (measuresInPercentIfChanged.y) {
            measuresInPercentIfChanged.y -= this.detached.shiftY;
        }
        if (measuresInPercentIfChanged.width) {
            measuresInPercentIfChanged.width /= this.detached.zoomX;
        }
        if (measuresInPercentIfChanged.height) {
            measuresInPercentIfChanged.height /= this.detached.zoomY;
        }
        return measuresInPercentIfChanged;
    }
    async shift(x, y) {
        if (!this.detached) {
            this.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            };
        }
        this.detached.shiftX += x;
        this.detached.shiftY += y;
        await this.referenceNode.renderStyleWithRerender({ renderStylePriority: RenderManager_1.RenderPriority.RESPONSIVE });
    }
    zoomToFit(options) {
        //return this.zoomToFitRect(new LocalRect(0, 0, 100, 100), options)
        return this.zoomToFitRect(new LocalRect_1.LocalRect(-5, -5, 110, 110), options);
    }
    async zoomToFitRect(rect, options) {
        if (!this.detached) {
            if (!this.referenceNode.isRoot()) {
                return this.referenceNode.getParent().site.zoomToFitRect(this.referenceNode.transform.toParentRect(rect), options);
            }
            this.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            };
        }
        const transitionDurationInMS = options?.transitionDurationInMS ?? 500;
        if (rect.width <= 0 || rect.height <= 0) {
            logService_1.log.warning(`Site::zoomToFitRect(..) spatial rift detected, width is ${rect.width}, height is ${rect.height}.`);
        }
        const mapClientRect = await this.referenceNode.context.getMapClientRect();
        const mapRectInParentCoords = LocalRect_1.LocalRect.fromPositions(await this.referenceNode.transform.clientToParentLocalPosition(mapClientRect.getTopLeftPosition()), await this.referenceNode.transform.clientToParentLocalPosition(mapClientRect.getBottomRightPosition()));
        const rectInParentCoords = this.referenceNode.transform.toParentRect(rect);
        const factorX = mapRectInParentCoords.width / rectInParentCoords.width;
        const factorY = mapRectInParentCoords.height / rectInParentCoords.height;
        const factor = Math.min(factorX, factorY);
        const referenceBoxClientRect = await this.referenceNode.getClientRect();
        const wouldBeWidthInPixels = referenceBoxClientRect.width * factor;
        const wouldBeHeightInPixels = referenceBoxClientRect.height * factor;
        if (factor > 1 && (wouldBeWidthInPixels > SizeAndPosition.delegateZoomToChildInPixels || wouldBeHeightInPixels > SizeAndPosition.delegateZoomToChildInPixels)) {
            return this.delegateZoomToFitRectToChild(rect, options);
        }
        else if (!this.referenceNode.isRoot() && this.detached.zoomX * factor < 1 && this.detached.zoomY * factor < 1) {
            return this.delegateZoomToFitRectToParent(rect, { transitionDurationInMS, ...options });
        }
        const renderRect = this.getLocalRectToRender();
        const mapMidInParentCoords = mapRectInParentCoords.getMidPosition();
        const rectOffsetXInParentCoords = rect.x * (renderRect.width / 100) * factor;
        const rectOffsetYInParentCoords = rect.y * (renderRect.height / 100) * factor;
        const shiftIncreaseX = mapMidInParentCoords.percentX - renderRect.x - rectInParentCoords.width * factor / 2 - rectOffsetXInParentCoords;
        const shiftIncreaseY = mapMidInParentCoords.percentY - renderRect.y - rectInParentCoords.height * factor / 2 - rectOffsetYInParentCoords;
        if (options?.animationIfAlreadyFitting && Math.abs(shiftIncreaseX) < 1 && Math.abs(shiftIncreaseY) < 1 && Math.abs(factor - 1) < 0.01) {
            const deltaX = rect.width / 100;
            const deltaY = rect.height / 100;
            await this.zoomToFitRect(new LocalRect_1.LocalRect(rect.x - deltaX, rect.y - deltaY, rect.width + deltaX * 2, rect.height + deltaY * 2), { transitionDurationInMS: transitionDurationInMS / 2 });
            await this.zoomToFitRect(rect, { transitionDurationInMS: transitionDurationInMS / 2 });
            return;
        }
        this.detached.shiftX += shiftIncreaseX;
        this.detached.shiftY += shiftIncreaseY;
        this.detached.zoomX *= factor;
        this.detached.zoomY *= factor;
        const renderStyleWithRerender = await this.referenceNode.renderStyleWithRerender({ renderStylePriority: RenderManager_1.RenderPriority.RESPONSIVE, transitionDurationInMS });
        await renderStyleWithRerender.transitionAndRerender;
    }
    async delegateZoomToFitRectToChild(rect, options) {
        const childSite = await this.findChildSiteToDelegateZoom();
        if (!childSite) {
            logService_1.log.warning(`SizeAndPosition::delegateZoomToFitRectToChild(..) Deeper zoom not implemented for '${this.referenceNode.getName()}'.`);
            return;
        }
        logService_1.log.info(`Site::zoomToFitRect(..) delegating zoom to child '${childSite.referenceNode.getName()}'.`);
        if (childSite.detached) {
            logService_1.log.warning('childSite is already detached');
        }
        else {
            childSite.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            };
        }
        // TODO finish mechanism that splits zoom for very big zoomSteps (so very small rects) but not an issue so far
        //if (wouldBeWidthInPixels > SizeAndPosition.delegateZoomToChildInPixels*5 || wouldBeHeightInPixels > SizeAndPosition.delegateZoomToChildInPixels*5) {
        //    if (!(wouldBeWidthInPixels > SizeAndPosition.delegateZoomToChildInPixels*10 || wouldBeHeightInPixels > SizeAndPosition.delegateZoomToChildInPixels*10)) {
        const rectInChildCoords = childSite.referenceNode.transform.fromParentRect(rect);
        return childSite.zoomToFitRect(rectInChildCoords, options);
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
    async delegateZoomToFitRectToParent(rect, options) {
        logService_1.log.info(`Site::zoomToFitRect(..) delegating zoom from '${this.referenceNode.getName()}' to parent.`);
        this.detached = undefined; // important to unset unpinning before calling 'transform.toParentRect(rect)' because it should calculate with updated site
        const transitionDurationInMS = options?.transitionDurationInMS;
        const rendering = this.referenceNode.renderStyleWithRerender({ renderStylePriority: RenderManager_1.RenderPriority.RESPONSIVE, transitionDurationInMS });
        const zoomingParent = this.referenceNode.getParent().site.zoomToFitRect(this.referenceNode.transform.toParentRect(rect), options);
        await (await rendering).transitionAndRerender;
        await zoomingParent;
        return;
    }
    async zoom(factor, position) {
        await this.zoomInParentCoords(factor, this.referenceNode.transform.toParentPosition(position));
    }
    async zoomInParentCoords(factor, positionInParentCoords) {
        if (!this.detached) {
            this.detached = {
                shiftX: 0,
                shiftY: 0,
                zoomX: 1,
                zoomY: 1
            };
        }
        const childSiteToDelegateZoom = await this.findDetachedChildSite(); // TODO: cache?, small lags appear while zooming on heavy load, this could be why, did not recognize them before
        if (childSiteToDelegateZoom) {
            return this.delegateZoomToChild(factor, positionInParentCoords, childSiteToDelegateZoom);
        }
        if (factor > 1) {
            const pixelRect = await this.referenceNode.getClientRect(); // TODO: do this after zooming, init detachment in child for next zoom?
            // TODO: small lags appear while zooming on heavy load, this could be why, did not recognize them before
            // TODO: or check with new detached values in case of very big zoom factor?
            const maxPixels = SizeAndPosition.delegateZoomToChildInPixels;
            if (pixelRect.x < -maxPixels || pixelRect.y < -maxPixels || pixelRect.width > maxPixels || pixelRect.height > maxPixels) {
                util_1.util.logInfo('SizeAndPosition::delegateZoomToChild(..)');
                return this.delegateZoomToChild(factor, positionInParentCoords);
            }
        }
        if (factor < 1
            && !this.referenceNode.isRoot()
            && (this.detached.shiftX > 0 && this.detached.shiftY > 0 && this.detached.zoomX < 1 && this.detached.zoomY < 1)) {
            util_1.util.logInfo('SizeAndPosition::delegateZoomToParent(..)');
            return this.delegateZoomToParent(factor, positionInParentCoords);
        }
        const renderRect = this.getLocalRectToRender();
        this.detached.shiftX -= (factor - 1) * (positionInParentCoords.percentX - renderRect.x);
        this.detached.shiftY -= (factor - 1) * (positionInParentCoords.percentY - renderRect.y);
        this.detached.zoomX *= factor;
        this.detached.zoomY *= factor;
        await this.referenceNode.renderStyle(RenderManager_1.RenderPriority.RESPONSIVE);
        await this.referenceNode.render();
    }
    async delegateZoomToChild(factor, positionInParentCoords, childSiteToDelegateZoom) {
        if (!childSiteToDelegateZoom) {
            childSiteToDelegateZoom = await this.findChildSiteToDelegateZoom();
            if (!childSiteToDelegateZoom) {
                logService_1.log.warning(`SizeAndPosition::delegateZoomToChild(..) Deeper zoom not implemented for '${this.referenceNode.getName()}'.`);
            }
        }
        return childSiteToDelegateZoom?.zoomInParentCoords(factor, this.referenceNode.transform.fromParentPosition(positionInParentCoords));
    }
    async delegateZoomToParent(factor, positionInParentCoords) {
        if (!this.detached) {
            util_1.util.logWarning(`SizeAndPosition::delegateZoomToParent(..) called when not detached.`);
            return;
        }
        const parentSite = this.referenceNode.getParent().site;
        if (!parentSite.detached) {
            util_1.util.logWarning(`SizeAndPosition::delegateZoomToParent(..) expected parent of detached box "${this.referenceNode.getName()}" do be detached as well while zooming.`);
            return;
        }
        const position = this.referenceNode.transform.fromParentPosition(positionInParentCoords); // store in local because relation to parent changes
        const parentRect = this.referenceNode.getParent().site.getLocalRectToRender();
        const localRect = this.getLocalRectToRender();
        const localRectCenter = new LocalPosition_1.LocalPosition(localRect.x + localRect.width / 2, localRect.y + localRect.height / 2);
        const localRectCenterInParentCoords = this.referenceNode.getParent().transform.toParentPosition(localRectCenter);
        const wouldBeShiftXWhenCentered = -(this.detached.zoomX - 1) * this.getLocalRectToSave().width / 2;
        const wouldBeShiftYWhenCentered = -(this.detached.zoomY - 1) * this.getLocalRectToSave().height / 2;
        const shiftXDistanceFromWouldBeCentered = this.detached.shiftX - wouldBeShiftXWhenCentered;
        const shiftYDistanceFromWouldBeCentered = this.detached.shiftY - wouldBeShiftYWhenCentered;
        parentSite.detached.shiftX += shiftXDistanceFromWouldBeCentered * this.detached.zoomX * parentRect.width / 100;
        parentSite.detached.shiftY += shiftYDistanceFromWouldBeCentered * this.detached.zoomY * parentRect.height / 100;
        parentSite.detached.shiftX -= (this.detached.zoomX - 1) * (localRectCenterInParentCoords.percentX - parentRect.x);
        parentSite.detached.shiftY -= (this.detached.zoomY - 1) * (localRectCenterInParentCoords.percentY - parentRect.y);
        parentSite.detached.zoomX *= this.detached.zoomX;
        parentSite.detached.zoomY *= this.detached.zoomY;
        this.detached = undefined;
        await Promise.all([
            this.referenceNode.renderStyle(RenderManager_1.RenderPriority.RESPONSIVE),
            this.referenceNode.getParent().site.zoom(factor, this.referenceNode.transform.toParentPosition(position))
        ]);
    }
    async findDetachedChildSite() {
        const renderedChildSite = await this.findChildSiteToDelegateZoom();
        if (!renderedChildSite || !renderedChildSite.isDetached()) {
            return undefined;
        }
        return renderedChildSite;
    }
    async findChildSiteToDelegateZoom() {
        const zoomedInChild = await this.referenceNode.getZoomedInChild();
        return zoomedInChild?.site;
    }
}
exports.SizeAndPosition = SizeAndPosition;
/** html elements which width, height, left, top is too big fail to render */
SizeAndPosition.delegateZoomToChildInPixels = 1000 * 1000; // TODO: can still be increased by magnitude when implementation is improved, worth it?
