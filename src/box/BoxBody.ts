import { renderManager } from '../RenderManager'
import { settings } from '../Settings'
import { Rect } from '../Rect'
import { Box } from './Box'
import { util } from '../util'

export abstract class BoxBody {
  private readonly referenceBox: Box
  private rendered: boolean = false
  private renderInProgress: boolean = false
  private rerenderAfterRenderFinished: boolean = false
  private unrenderAfterRenderFinished: boolean = false
  private unrenderAfterRenderFinishedForce?: boolean

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public isRendered(): boolean {
    return this.rendered
  }

  public getId(): string {
    return this.referenceBox.getId()+'Body'
  }

  public async render(): Promise<void> { // TODO: make sure only one thread is in this method (semaphore)
    if (this.renderInProgress) {
      this.scheduleRerender(true)
      return // TODO: should return promise that resolves when current render operation and scheduled rerender operation are finished
    }
    this.renderInProgress = true // TODO: make atomic with if statement

    if (! await this.shouldBeRendered()) {
      this.renderInProgress = false
      if (this.isRendered() && await this.shouldBeUnrendered()) {
        await this.unrenderIfPossible()
      }
      return
    }

    await this.executeRender()

    this.rendered = true
    this.renderInProgress = false

    await this.rerenderIfNecessary()
  }

  public async unrenderIfPossible(force?: boolean): Promise<{rendered: boolean}> {
    if (this.renderInProgress) {
      this.scheduleRerender(false, force)
      return {rendered: this.rendered} // TODO: should return promise that resolves when current render operation and scheduled rerender operation are finished
    }
    this.renderInProgress = true // TODO: make atomic with if statement

    this.rendered = (await this.executeUnrenderIfPossible(force)).rendered

    this.renderInProgress = false

    await this.rerenderIfNecessary()
    return {rendered: this.rendered}
  }

  private scheduleRerender(render: boolean, forceIfUnrender?: boolean): void {
    this.rerenderAfterRenderFinished = render
    this.unrenderAfterRenderFinished = !render
    this.unrenderAfterRenderFinishedForce = forceIfUnrender
  }

  private async rerenderIfNecessary(): Promise<void> {
    if (this.rerenderAfterRenderFinished && this.unrenderAfterRenderFinished) {
      util.logWarning('rerenderAfterRenderFinished and unrenderAfterRenderFinished are both true, this should not happen')
    }
    if (this.rerenderAfterRenderFinished) {
      this.rerenderAfterRenderFinished = false
      await this.render()
    } else if (this.unrenderAfterRenderFinished) {
      this.unrenderAfterRenderFinished = false
      await this.unrenderIfPossible(this.unrenderAfterRenderFinishedForce)
    }
  }

  public abstract executeRender(): Promise<void>

  public abstract executeUnrenderIfPossible(force?: boolean): Promise<{rendered: boolean}>

  private async shouldBeRendered(): Promise<boolean> {
    if (this.referenceBox.hasWatchers()) {
      return true
    }

    const boxRect: Rect = await renderManager.getClientRectOf(this.referenceBox.getId())
    return this.isRectLargeEnoughToRender(boxRect) && this.isRectInsideScreen(boxRect)
  }

  private async shouldBeUnrendered(): Promise<boolean> {
    if (this.referenceBox.isRoot() || this.referenceBox.hasWatchers()) {
      return false
    }
    const boxRect: Rect = await renderManager.getClientRectOf(this.referenceBox.getId())
    return this.isRectSmallEnoughToUnrender(boxRect) || this.isRectNotablyOutsideScreen(boxRect)
  }

  private isRectLargeEnoughToRender(rect: Rect): boolean {
    return (rect.width+rect.height)/2 >= settings.getBoxMinSizeToRender()
  }

  private isRectSmallEnoughToUnrender(rect: Rect): boolean {
    return (rect.width+rect.height)/2 < settings.getBoxMinSizeToRender()*0.8
  }

  private isRectInsideScreen(rect: Rect): boolean {
    if (rect.x+rect.width < 0) {
      return false
    }
    if (rect.y+rect.height < 0) {
      return false
    }

    const clientSize = renderManager.getClientSize()
    if (rect.x > clientSize.width) {
      return false
    }
    if (rect.y > clientSize.height) {
      return false
    }

    return true
  }

  private isRectNotablyOutsideScreen(rect: Rect): boolean {
    if (rect.x+rect.width < -20) {
      return true
    }
    if (rect.y+rect.height < -20) {
      return true
    }

    const clientSize = renderManager.getClientSize()
    if (rect.x > clientSize.width+20) {
      return true
    }
    if (rect.y > clientSize.height+20) {
      return true
    }

    return false
  }

}
