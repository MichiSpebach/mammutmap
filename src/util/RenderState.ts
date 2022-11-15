import { util } from '../util'

export class RenderState { // TODO: develop to Promise based RenderScheduler that has method scheduleOrSkip
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
        if (this.rendered) {
            //util.logWarning('RenderState::finishUnrender() called while rendered already false') // TODO reactivate?
        }
        if (!this.unrenderInProgress) {
            util.logWarning('RenderState::finishUnrender() called while unrenderInProgress is false')
        }
        this.rendered = false
        this.unrenderInProgress = false
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