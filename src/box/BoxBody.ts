import { renderManager } from '../RenderManager'
import { settings } from '../Settings'
import { ClientRect } from '../ClientRect'
import { Box } from './Box'
import { style } from '../styleAdapter'
import { RenderState } from '../util/RenderState'

export abstract class BoxBody {
  private readonly referenceBox: Box
  private renderScheduler: RenderState = new RenderState()
  private zoomInToRenderHintRendered: boolean = false

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public isRendered(): boolean {
    return this.renderScheduler.isRendered()
  }

  public isBeingRendered(): boolean {
    return this.renderScheduler.isBeingRendered()
  }

  public getId(): string {
    return this.referenceBox.getId()+'Body'
  }

  public async render(): Promise<void> {
    if (this.renderScheduler.isRenderInProgress()) {
      await this.renderScheduler.ongoingProcess // TODO: is this really needed, find better solution, remove?
    }

    if (! await this.shouldBeRendered()) {
      if (this.isRendered() && await this.shouldBeUnrendered()) {
        await this.unrenderIfPossible() // TODO: introduce runUnrenderIfPossible and wrap whole method with renderSchedule
        return
      }
      if (!this.isRendered()) {
        await this.renderZoomInToRenderHint() // TODO: this should also be done with renderScheduler
        return
      }
      // no return here, stays rendered, render needs to be propagated
    }

    await this.renderScheduler.scheduleRender(async () => {
      await Promise.all([
        this.unrenderZoomInToRenderHint(),
        this.executeRender(),
        this.referenceBox.nodes.render()
      ])
      await this.referenceBox.links.render()
    })
  }

  public async unrenderIfPossible(force?: boolean): Promise<{rendered: boolean}> { await this.renderScheduler.scheduleOrSkip(async () => {
    this.renderScheduler.unrenderStarted()
    const anyChildStillRendered: boolean = (await this.executeUnrenderIfPossible(force)).anyChildStillRendered
    if (!anyChildStillRendered) { // TODO: remove condition and unrender as much as possible?
      await this.referenceBox.links.unrender() // TODO: move above executeUnrenderIfPossible, but then also unrenders links that are connected to childs that are not unrendered?
      await this.referenceBox.nodes.unrender()
      await this.renderZoomInToRenderHint()
      this.renderScheduler.unrenderFinished()
    } else {
      this.renderScheduler.unrenderFinishedStillRendered()
    }
    })
    
    return {rendered: this.renderScheduler.isRendered()}
  }

  protected abstract executeRender(): Promise<void>

  protected abstract executeUnrenderIfPossible(force?: boolean): Promise<{anyChildStillRendered: boolean}>

  private async renderZoomInToRenderHint(): Promise<void> {
    if (this.zoomInToRenderHintRendered) {
      return
    }
    this.zoomInToRenderHintRendered = true
    let html: string = `<div id="${this.getId()+'ZoomInToRenderHint'}" class="${style.getBoxBodyZoomInToRenderHintClass()}">`
    html += `<div class="${style.getBoxBodyZoomInToRenderHintTextClass()}">zoom in to render</div>`
    html += '</div>'
    await renderManager.addContentTo(this.getId(), html)
  }

  private async unrenderZoomInToRenderHint(): Promise<void> {
    if (!this.zoomInToRenderHintRendered) {
      return
    }
    this.zoomInToRenderHintRendered = false
    await renderManager.remove(this.getId()+'ZoomInToRenderHint')
  }

  private async shouldBeRendered(): Promise<boolean> {
    if (this.referenceBox.hasWatchers()) {
      return true
    }

    const boxRect: ClientRect = await this.referenceBox.getClientRect()
    return this.isRectLargeEnoughToRender(boxRect) && this.isRectInsideScreen(boxRect)
  }

  private async shouldBeUnrendered(): Promise<boolean> {
    if (this.referenceBox.isRoot() || this.referenceBox.hasWatchers()) {
      return false
    }
    const boxRect: ClientRect = await this.referenceBox.getClientRect()
    return this.isRectSmallEnoughToUnrender(boxRect) || this.isRectNotablyOutsideScreen(boxRect)
  }

  private isRectLargeEnoughToRender(rect: ClientRect): boolean {
    return (rect.width+rect.height)/2 >= settings.getBoxMinSizeToRender()
  }

  private isRectSmallEnoughToUnrender(rect: ClientRect): boolean {
    return (rect.width+rect.height)/2 < settings.getBoxMinSizeToRender()*0.8
  }

  private isRectInsideScreen(rect: ClientRect): boolean {
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

  private isRectNotablyOutsideScreen(rect: ClientRect): boolean {
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
