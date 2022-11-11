import { util } from '../util'

export class RenderState { // TODO: develop to Promise based RenderScheduler?
    private rendered: boolean = false
    private renderInProgress: boolean = false
    private unrenderInProgress: boolean = false

    public startRender(): void {
        if (this.unrenderInProgress) {
            util.logWarning('RenderState::startRender() called while unrenderInProgress')
        }
        this.renderInProgress = true
    }

    public finishRender(): void {
        if (this.rendered) {
            //util.logWarning('RenderState::finishRender() called while rendered already true') // TODO reactivate?
        }
        if (!this.renderInProgress) {
            util.logWarning('RenderState::finishRender() called while renderInProgress is false')
        }
        this.rendered = true
        this.renderInProgress = false
    }

    public startUnrender(): void {
        if (this.renderInProgress) {
            util.logWarning('RenderState::startUnrender() called while renderInProgress')
        }
        this.unrenderInProgress = true
    }

    public finishUnrender(): void {
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

    public shouldBeRendered(): boolean { // TODO: rename to isRenderedOrInProgress()|isAboutToRender()|isBeingRendered()?
        if (this.renderInProgress) {
            return true
        } else if (this.unrenderInProgress) {
            return false
        } else {
            return this.rendered
        }
    }

}