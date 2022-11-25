import { util } from '../util'

// TODO: introduce interface RenderStateReadonly|RenderStateReader to have public getRenderStateReader(): RenderStateReader in Widgets?
export class RenderState {
    private rendered: boolean = false
    private renderInProgress: boolean = false
    private unrenderInProgress: boolean = false

    public renderStarted(): void {
        if (this.unrenderInProgress) {
            util.logWarning('RenderState::startRender() called while unrenderInProgress')
        }
        this.renderInProgress = true
    }

    public renderFinished(): void {
        if (this.rendered) {
            //util.logWarning('RenderState::finishRender() called while rendered already true') // TODO reactivate?
        }
        if (!this.renderInProgress) {
            //util.logWarning('RenderState::finishRender() called while renderInProgress is false') // TODO happens because of not handled race conditions, fix usages and reactivate asap
        }
        this.rendered = true
        this.renderInProgress = false
    }

    public unrenderStarted(): void {
        if (this.renderInProgress) {
            util.logWarning('RenderState::startUnrender() called while renderInProgress')
        }
        this.unrenderInProgress = true
    }

    public unrenderFinished(): void {
        this.validateUnrenderFinished()
        this.rendered = false
        this.unrenderInProgress = false
    }

    public unrenderFinishedStillRendered(): void {
        this.validateUnrenderFinished()
        this.rendered = true
        this.unrenderInProgress = false
    }

    private validateUnrenderFinished(): void {
        if (this.rendered) {
            //util.logWarning('RenderState::finishUnrender() called while rendered already false') // TODO reactivate?
        }
        if (!this.unrenderInProgress) {
            util.logWarning('RenderState::finishUnrender() called while unrenderInProgress is false')
        }
    }

    public isRendered(): boolean {
        return this.rendered
    }

    public isUnrendered(): boolean {
        return !this.rendered
    }

    public isRenderInProgress(): boolean {
        return this.renderInProgress
    }

    public isUnrenderInProgress(): boolean {
        return this.unrenderInProgress
    }

    public isBeingRendered(): boolean { // TODO: rename to isRenderedOrInProgress()?
        if (this.renderInProgress) {
            return true
        } else if (this.unrenderInProgress) {
            return false
        } else {
            return this.rendered
        }
    }

    public isBeingUnrendered(): boolean {
        return !this.isBeingRendered()
    }

}