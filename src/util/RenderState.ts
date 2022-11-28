import { util } from '../util'

// TODO: introduce interface RenderStateReadonly|RenderStateReader to have public getRenderStateReader(): RenderStateReader in Widgets?
export class RenderState {
    private rendered: boolean = false
    private renderInProgress: boolean = false
    private unrenderInProgress: boolean = false

    public setRenderStarted(): void {
        if (this.renderInProgress) {
            util.logWarning('RenderState::setRenderStarted() called while renderInProgress')
        }
        if (this.unrenderInProgress) {
            util.logWarning('RenderState::setRenderStarted() called while unrenderInProgress')
        }
        this.renderInProgress = true
    }

    public setRenderFinished(): void {
        if (!this.renderInProgress) {
            util.logWarning('RenderState::setRenderFinished() called while renderInProgress is false')
        }
        this.rendered = true
        this.renderInProgress = false
    }

    public setUnrenderStarted(): void {
        if (this.renderInProgress) {
            util.logWarning('RenderState::setUnrenderStarted() called while renderInProgress')
        }
        if (this.unrenderInProgress) {
            util.logWarning('RenderState::setUnrenderStarted() called while unrenderInProgress')
        }
        this.unrenderInProgress = true
    }

    public setUnrenderFinished(): void {
        this.validateUnrenderFinished()
        this.rendered = false
        this.unrenderInProgress = false
    }

    public setUnrenderFinishedStillRendered(): void {
        this.validateUnrenderFinished()
        this.rendered = true
        this.unrenderInProgress = false
    }

    private validateUnrenderFinished(): void {
        if (!this.rendered) {
            util.logWarning('RenderState::setUnrenderFinished() called while rendered already false')
        }
        if (!this.unrenderInProgress) {
            util.logWarning('RenderState::setUnrenderFinished() called while unrenderInProgress is false')
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