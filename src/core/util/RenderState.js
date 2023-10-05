"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RenderState = void 0;
const util_1 = require("./util");
// TODO: introduce interface RenderStateReadonly|RenderStateReader to have public getRenderStateReader(): RenderStateReader in Widgets?
class RenderState {
    constructor() {
        this.rendered = false;
        this.renderInProgress = false;
        this.unrenderInProgress = false;
    }
    setRenderStarted() {
        if (this.renderInProgress) {
            util_1.util.logWarning('RenderState::setRenderStarted() called while renderInProgress');
        }
        if (this.unrenderInProgress) {
            util_1.util.logWarning('RenderState::setRenderStarted() called while unrenderInProgress');
        }
        this.renderInProgress = true;
    }
    setRenderFinished() {
        if (!this.renderInProgress) {
            util_1.util.logWarning('RenderState::setRenderFinished() called while renderInProgress is false');
        }
        this.rendered = true;
        this.renderInProgress = false;
    }
    setUnrenderStarted() {
        if (this.renderInProgress) {
            util_1.util.logWarning('RenderState::setUnrenderStarted() called while renderInProgress');
        }
        if (this.unrenderInProgress) {
            util_1.util.logWarning('RenderState::setUnrenderStarted() called while unrenderInProgress');
        }
        this.unrenderInProgress = true;
    }
    setUnrenderFinished() {
        this.validateUnrenderFinished();
        this.rendered = false;
        this.unrenderInProgress = false;
    }
    setUnrenderFinishedStillRendered() {
        this.validateUnrenderFinished();
        this.rendered = true;
        this.unrenderInProgress = false;
    }
    validateUnrenderFinished() {
        if (!this.rendered) {
            util_1.util.logWarning('RenderState::setUnrenderFinished() called while rendered already false');
        }
        if (!this.unrenderInProgress) {
            util_1.util.logWarning('RenderState::setUnrenderFinished() called while unrenderInProgress is false');
        }
    }
    isRendered() {
        return this.rendered;
    }
    isUnrendered() {
        return !this.rendered;
    }
    isRenderInProgress() {
        return this.renderInProgress;
    }
    isUnrenderInProgress() {
        return this.unrenderInProgress;
    }
    isBeingRendered() {
        if (this.renderInProgress) {
            return true;
        }
        else if (this.unrenderInProgress) {
            return false;
        }
        else {
            return this.rendered;
        }
    }
    isBeingUnrendered() {
        return !this.isBeingRendered();
    }
}
exports.RenderState = RenderState;
