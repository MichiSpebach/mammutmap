"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxBody = void 0;
const RenderManager_1 = require("../RenderManager");
const Settings_1 = require("../Settings");
const styleAdapter_1 = require("../styleAdapter");
const RenderState_1 = require("../util/RenderState");
const SkipToNewestScheduler_1 = require("../util/SkipToNewestScheduler");
class BoxBody {
    constructor(referenceBox) {
        //public readonly nodes: BoxNodesWidget // TODO: introduce (Abstract)NodesWidget|SubNodesWidget|ChildNodesWidget that contains all sorts of childNodes (Boxes and LinkNodes)?
        //public readonly links: BoxLinks // TODO: rename to managedLinks?
        this.renderState = new RenderState_1.RenderState();
        this.renderScheduler = new SkipToNewestScheduler_1.SkipToNewestScheduler();
        this.zoomInToRenderHintRendered = false;
        this.referenceBox = referenceBox;
    }
    isRendered() {
        return this.renderState.isRendered();
    }
    isBeingRendered() {
        return this.renderState.isBeingRendered();
    }
    getId() {
        return this.referenceBox.getId() + 'Body';
    }
    async render() {
        await this.renderScheduler.schedule(async () => {
            if (!await this.shouldBeRendered()) {
                if (this.renderState.isRendered() && await this.shouldBeUnrendered()) {
                    await this.runUnrenderIfPossible();
                    return;
                }
                if (this.renderState.isUnrendered()) {
                    await this.renderZoomInToRenderHint();
                    return;
                }
                // no return here, stays rendered, render needs to be propagated
            }
            this.renderState.setRenderStarted();
            await this.unrenderZoomInToRenderHint(),
                await Promise.all([
                    this.executeRender(),
                    this.referenceBox.nodes.render()
                ]);
            await this.referenceBox.links.render();
            this.renderState.setRenderFinished();
        });
    }
    async unrenderIfPossible(force) {
        await this.renderScheduler.schedule(() => this.runUnrenderIfPossible(force));
        return { rendered: this.renderState.isRendered() };
    }
    async runUnrenderIfPossible(force) {
        if (this.renderState.isUnrendered()) {
            await this.unrenderZoomInToRenderHint();
            return;
        }
        this.renderState.setUnrenderStarted();
        const anyChildStillRendered = (await this.executeUnrenderIfPossible(force)).anyChildStillRendered;
        if (!anyChildStillRendered) { // TODO: remove condition and unrender as much as possible?
            await this.referenceBox.links.unrender(); // TODO: move above executeUnrenderIfPossible, but then also unrenders links that are connected to childs that are not unrendered?
            await this.referenceBox.nodes.unrender();
            await this.renderZoomInToRenderHint();
            this.renderState.setUnrenderFinished();
        }
        else {
            this.renderState.setUnrenderFinishedStillRendered();
        }
    }
    async renderZoomInToRenderHint() {
        if (this.zoomInToRenderHintRendered) {
            return;
        }
        this.zoomInToRenderHintRendered = true;
        let html = `<div id="${this.getId() + 'ZoomInToRenderHint'}" class="${styleAdapter_1.style.getBoxBodyZoomInToRenderHintClass()}">`;
        html += `<div class="${styleAdapter_1.style.getBoxBodyZoomInToRenderHintTextClass()}">zoom in to render</div>`;
        html += '</div>';
        await RenderManager_1.renderManager.addContentTo(this.getId(), html);
    }
    async unrenderZoomInToRenderHint() {
        if (!this.zoomInToRenderHintRendered) {
            return;
        }
        this.zoomInToRenderHintRendered = false;
        await RenderManager_1.renderManager.remove(this.getId() + 'ZoomInToRenderHint');
    }
    async shouldBeRendered() {
        if (this.referenceBox.hasWatchers()) {
            return true;
        }
        const boxRect = await this.referenceBox.getClientRect();
        return this.isRectLargeEnoughToRender(boxRect) && this.isRectInsideScreen(boxRect);
    }
    async shouldBeUnrendered() {
        if (this.referenceBox.isRoot() || this.referenceBox.hasWatchers()) {
            return false;
        }
        const boxRect = await this.referenceBox.getClientRect();
        return this.isRectSmallEnoughToUnrender(boxRect) || this.isRectNotablyOutsideScreen(boxRect);
    }
    isRectLargeEnoughToRender(rect) {
        return (rect.width + rect.height) / 2 >= Settings_1.settings.getBoxMinSizeToRender();
    }
    isRectSmallEnoughToUnrender(rect) {
        return (rect.width + rect.height) / 2 < Settings_1.settings.getBoxMinSizeToRender() * 0.8;
    }
    isRectInsideScreen(rect) {
        if (rect.x + rect.width < 0) {
            return false;
        }
        if (rect.y + rect.height < 0) {
            return false;
        }
        const clientSize = RenderManager_1.renderManager.getClientSize();
        if (rect.x > clientSize.width) {
            return false;
        }
        if (rect.y > clientSize.height) {
            return false;
        }
        return true;
    }
    isRectNotablyOutsideScreen(rect) {
        if (rect.x + rect.width < -20) {
            return true;
        }
        if (rect.y + rect.height < -20) {
            return true;
        }
        const clientSize = RenderManager_1.renderManager.getClientSize();
        if (rect.x > clientSize.width + 20) {
            return true;
        }
        if (rect.y > clientSize.height + 20) {
            return true;
        }
        return false;
    }
}
exports.BoxBody = BoxBody;
