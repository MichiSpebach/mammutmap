import { util } from '../util'

export class RenderState { // TODO: develop to Promise based RenderScheduler that has method scheduleOrSkip
    private rendered: boolean = false
    private renderInProgress: boolean = false
    private unrenderInProgress: boolean = false
    public ongoingProcess: Promise<void>|null = null
    private scheduledProcess: (() => Promise<void>)|null = null

    public async scheduleRender(process: () => Promise<void>): Promise<void> {
        await this.scheduleOrSkip(async () => {
            this.renderStarted()
            await process()
            this.renderFinished()
        })
    }

    public async scheduleUnrender(process: () => Promise<void>): Promise<void> {
        await this.scheduleOrSkip(async () => {
            this.unrenderStarted()
            await process()
            this.unrenderFinished()
        })
    }

    public async scheduleOrSkip(process: () => Promise<void>): Promise<void> {
        if (!this.ongoingProcess) {
            this.ongoingProcess = process()
            await this.ongoingProcess
            this.ongoingProcess = null
        } else {
            this.scheduledProcess = process
            await this.ongoingProcess
            if (!this.ongoingProcess) {
                this.ongoingProcess = this.scheduledProcess()
                this.scheduledProcess = null
                await this.ongoingProcess
                this.ongoingProcess = null
            } else {
                await this.ongoingProcess
            }
        }
    }

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