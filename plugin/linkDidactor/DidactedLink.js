"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidactedLink = void 0;
const pluginFacade_1 = require("../../dist/pluginFacade");
const RenderManager_1 = require("../../dist/RenderManager");
const linkDidactorSettings = require("./linkDidactorSettings");
class DidactedLink extends pluginFacade_1.LinkImplementation {
    constructor() {
        super(...arguments);
        this.currentStyle = null;
        this.styleTimer = null;
    }
    static getSuperClass() {
        return Object.getPrototypeOf(DidactedLink.prototype).constructor;
    }
    async render(priority) {
        if (this.getMode() === 'notRendered') {
            return super.unrender();
        }
        await Promise.all([
            this.updateStyle(priority),
            super.render(priority)
        ]);
    }
    async unrender() {
        this.clearStyleTimer();
        await super.unrender();
    }
    getMode() {
        return linkDidactorSettings.getComputedModeForLinkTags(this.getTags());
    }
    getColor() {
        const color = linkDidactorSettings.getComputedColorForLinkTags(this.getTags());
        if (color === linkDidactorSettings.boxIdHashColorName) {
            return this.getColorByToBoxIdHash();
        }
        return color;
    }
    getColorByToBoxIdHash() {
        let toBoxId;
        const dropTargetIfRenderInProgress = this.getTo().getDropTargetIfRenderInProgress();
        if (dropTargetIfRenderInProgress) {
            toBoxId = dropTargetIfRenderInProgress.getId();
        }
        else {
            const path = this.getData().to.path;
            toBoxId = path[path.length - 1].boxId;
        }
        const hash = toBoxId.charCodeAt(0) + toBoxId.charCodeAt(toBoxId.length / 2) + toBoxId.charCodeAt(toBoxId.length - 1);
        return linkDidactorSettings.linkColors[hash % linkDidactorSettings.linkColors.length];
    }
    async updateStyle(priority = RenderManager_1.RenderPriority.NORMAL) {
        let style = '';
        const firstCall = !this.currentStyle;
        const hideTransitionDurationInMs = 1000;
        let startDisplayNoneTimer = false;
        if (this.getMode() === 'hidden') {
            if (this.isHighlight()) {
                style = 'opacity:0.5;';
            }
            else if (firstCall) {
                style = 'display:none;';
            }
            else {
                startDisplayNoneTimer = true;
                style = 'transition-duration:' + hideTransitionDurationInMs + 'ms;opacity:0;';
            }
        }
        if (this.currentStyle === style) {
            return;
        }
        this.currentStyle = style;
        this.clearStyleTimer();
        if (startDisplayNoneTimer) {
            this.styleTimer = setTimeout(() => {
                RenderManager_1.renderManager.setStyleTo(this.getId(), 'display:none;', priority);
                this.styleTimer = null;
            }, hideTransitionDurationInMs);
        }
        if (!firstCall || style !== '') {
            await RenderManager_1.renderManager.setStyleTo(this.getId(), style, priority);
        }
    }
    clearStyleTimer() {
        if (this.styleTimer) {
            clearTimeout(this.styleTimer);
            this.styleTimer = null;
        }
    }
}
exports.DidactedLink = DidactedLink;
