import { renderManager } from '../renderEngine/renderManager'
import { settings } from '../settings/settings'
import { ClientRect } from '../ClientRect'
import { Box } from './Box'
import { style } from '../styleAdapter'
import { BoxNodesWidget } from './BoxNodesWidget'
import { BoxLinks } from './BoxLinks'
import { RenderState } from '../util/RenderState'
import { SkipToNewestScheduler } from '../util/SkipToNewestScheduler'

export abstract class BoxBody {
  private readonly referenceBox: Box
  //public readonly nodes: BoxNodesWidget // TODO: introduce (Abstract)NodesWidget|SubNodesWidget|ChildNodesWidget that contains all sorts of childNodes (Boxes and LinkNodes)?
  //public readonly links: BoxLinks // TODO: rename to managedLinks?
  private renderState: RenderState = new RenderState()
  private renderScheduler: SkipToNewestScheduler = new SkipToNewestScheduler()
  private zoomInToRenderHintRendered: boolean = false

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public isRendered(): boolean {
    return this.renderState.isRendered()
  }

  public isBeingRendered(): boolean {
    return this.renderState.isBeingRendered()
  }

  public getId(): string {
    return this.referenceBox.getId()+'Body'
  }

  /** TODO: name is confusing, does render or unrender, rename to something like 'update()'? */
  public async render(): Promise<void> { await this.renderScheduler.schedule(async () => {
    if (! await this.shouldBeRendered()) {
      if (this.renderState.isRendered() && await this.shouldBeUnrendered()) {
        await this.runUnrenderIfPossible()
        await this.renderZoomInToRenderHint()
        return
      }
      if (this.renderState.isUnrendered()) {
        await this.renderZoomInToRenderHint()
        return
      }
      // no return here, stays rendered, render needs to be propagated
    }

    this.renderState.setRenderStarted()

    await this.unrenderZoomInToRenderHint()
    await Promise.all([
      this.executeRender(),
      this.referenceBox.nodes.render()
    ])
    await this.referenceBox.links.render()

    this.renderState.setRenderFinished()
  })}

  public async unrenderIfPossible(force?: boolean): Promise<{rendered: boolean}> {
    await this.renderScheduler.schedule(() => this.runUnrenderIfPossible(force))
    return {rendered: this.renderState.isRendered()}
  }

  private async runUnrenderIfPossible(force?: boolean): Promise<void> {
    if (this.renderState.isUnrendered()) {
      await this.unrenderZoomInToRenderHint()
      return
    }
    this.renderState.setUnrenderStarted()
    
    const anyChildStillRendered: boolean = (await this.executeUnrenderIfPossible(force)).anyChildStillRendered
    if (!anyChildStillRendered) { // TODO: remove condition and unrender as much as possible?
      await this.referenceBox.links.unrender() // TODO: move above executeUnrenderIfPossible, but then also unrenders links that are connected to childs that are not unrendered?
      await this.referenceBox.nodes.unrender()
      this.renderState.setUnrenderFinished()
    } else {
      this.renderState.setUnrenderFinishedStillRendered()
    }
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
