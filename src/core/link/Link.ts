import { util } from '../util/util'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu'
import { Box } from '../box/Box'
import { BoxLinks } from '../box/BoxLinks'
import { LinkData } from '../mapData/LinkData'
import { LinkEnd } from './LinkEnd'
import { Hoverable } from '../Hoverable'
import { HoverManager } from '../HoverManager'
import { ClientPosition } from '../shape/ClientPosition'
import { LocalPosition } from '../shape/LocalPosition'
import { NodeWidget } from '../node/NodeWidget'
import { LinkLine } from './LinkLine'
import { RenderState } from '../util/RenderState'
import { SkipToNewestScheduler } from '../util/SkipToNewestScheduler'
import { ClientRect } from '../ClientRect'
import { relocationDragManager } from '../RelocationDragManager'
import { log } from '../logService'

export function override(implementation: typeof LinkImplementation): void {
  LinkImplementation = implementation
}

export let LinkImplementation: typeof Link /*= Link*/ // assigned after declaration at end of file

// important: always extend from LinkImplementation (important for plugins)
export class Link implements Hoverable {
  private readonly data: LinkData
  private managingBox: Box
  public readonly line: LinkLine
  public readonly from: LinkEnd
  public readonly to: LinkEnd
  private renderState: RenderState = new RenderState()
  private renderScheduler: SkipToNewestScheduler = new SkipToNewestScheduler()
  private highlight: boolean = false
  private draggingInProgress: boolean = false
  private hoveringOver: boolean = false

  public static new(data: LinkData, managingBox: Box): Link {
    return new LinkImplementation(data, managingBox)
  }

  protected constructor(data: LinkData, managingBox: Box) {
    this.data = data
    this.managingBox = managingBox
    this.line = LinkLine.new(this.data.id+'line', this)
    this.from = new LinkEnd(this.data.id+'from', this.data.from, this, 'square')
    this.to = new LinkEnd(this.data.id+'to', this.data.to, this, 'arrow')
  }

  public getId(): string {
    return this.data.id
  }

  public getData(): LinkData {
    return this.data
  }

  public getManagingBox(): Box {
    return this.managingBox
  }

  public getManagingBoxLinks(): BoxLinks {
    return this.managingBox.links
  }

  public getFrom(): LinkEnd {
    return this.from
  }

  public getTo(): LinkEnd {
    return this.to
  }

  public async renderWithOptions(options: {
    priority?: RenderPriority
    highlight?: boolean
    draggingInProgress?: boolean
    hoveringOver?: boolean
  }): Promise<void> {
    if (options.highlight !== undefined) {
      this.highlight = options.highlight
    }
    if (options.draggingInProgress !== undefined) {
      this.draggingInProgress = options.draggingInProgress
    }
    if (options.hoveringOver !== undefined) {
      this.hoveringOver = options.hoveringOver
    }

    return this.render(options.priority)
  }

  public async render(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> { await this.renderScheduler.schedule(async () => {
    if (!this.getManagingBox().isBodyBeingRendered()) {
      log.warning(`Link::render(..) called for Link with id ${this.getId()} unless the body its managingBox with name ${this.getManagingBox().getName()} is being unrendered.`)
      return
    }
    this.renderState.setRenderStarted()

    const fromInManagingBoxCoordsPromise: Promise<LocalPosition> = this.from.getRenderPositionInManagingBoxCoords()
    const toInManagingBoxCoords: LocalPosition = await this.to.getRenderPositionInManagingBoxCoords()
    const fromInManagingBoxCoords: LocalPosition = await fromInManagingBoxCoordsPromise

    const lineInnerHtml: string = await this.line.formInnerHtml(fromInManagingBoxCoords, toInManagingBoxCoords, this.draggingInProgress, this.hoveringOver)

    const proms: Promise<any>[] = []

    if (!this.renderState.isRendered()) {
      const draggableHtml: string = relocationDragManager.isUsingNativeDragEvents() ? 'draggable="true"' : ''
      const fromHtml: string = `<div id="${this.from.getId()}" ${draggableHtml} class="${style.getHighlightTransitionClass()}"></div>`
      const toHtml: string = `<div id="${this.to.getId()}" ${draggableHtml} class="${style.getHighlightTransitionClass()}"></div>`
      const lineStyle: string = 'position:absolute;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;'
      const lineHtml: string = `<svg id="${this.line.getId()}" style="${lineStyle}">${lineInnerHtml}</svg>`
      await renderManager.setContentTo(this.getId(), lineHtml+fromHtml+toHtml, priority)
      proms.push(this.addEventListeners())
    } else {
      proms.push(renderManager.setContentTo(this.line.getId(), lineInnerHtml, priority))
    }

    // TODO: too many awaits, optimize
    const fromClientPosition: ClientPosition = await this.managingBox.transform.localToClientPosition(fromInManagingBoxCoords)
    const toClientPosition: ClientPosition = await this.managingBox.transform.localToClientPosition(toInManagingBoxCoords)
    const distanceX: number = toClientPosition.x-fromClientPosition.x
    const distanceY: number = toClientPosition.y-fromClientPosition.y
    const angleInRadians: number = Math.atan2(distanceY, distanceX)
    proms.push(this.from.render(fromInManagingBoxCoords, angleInRadians))
    proms.push(this.to.render(toInManagingBoxCoords, angleInRadians))

    await Promise.all(proms)
    this.renderState.setRenderFinished()
  })}

  public async unrender(): Promise<void> { await this.renderScheduler.schedule( async () => {
    if (this.renderState.isUnrendered()) {
      return
    }
    this.renderState.setUnrenderStarted()

    await Promise.all([
      this.removeEventListeners(),
      this.from.unrender(),
      this.to.unrender()
    ])

    await renderManager.clearContentOf(this.getId())
    this.renderState.setUnrenderFinished()
  })}

  public getColor(): string {
    return style.getLinkColor()
  }

  private async addEventListeners(): Promise<void> {
    const proms: Promise<any>[] = []
    proms.push(renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForLink(this, new ClientPosition(clientX, clientY))))
    proms.push(HoverManager.addHoverable(this, () => this.handleHoverOver(),() => this.handleHoverOut()))
    await Promise.all(proms)
  }

  private async removeEventListeners(): Promise<void> {
    const proms: Promise<any>[] = []
    proms.push(HoverManager.removeHoverable(this))
    proms.push(renderManager.removeEventListenerFrom(this.getId(), 'contextmenu'))
    await Promise.all(proms)
  }

  private async handleHoverOver(): Promise<void> {
    if (this.renderState.isBeingUnrendered()) {
      util.logWarning('handleHoverHover() called on link with id '+this.getId()+' altough link is not rendered.')
      this.highlight = true
      this.hoveringOver = true
      return
    }
    await this.renderWithOptions({priority: RenderPriority.RESPONSIVE, highlight: true, hoveringOver: true})
  }

  private async handleHoverOut(): Promise<void> {
    if (this.renderState.isBeingUnrendered()) {
      this.highlight = false
      this.hoveringOver = false
      return
    }
    await this.renderWithOptions({priority: RenderPriority.RESPONSIVE, highlight: false, hoveringOver: false})
  }

  public isHighlight(): boolean {
    return this.highlight
  }

  public getHighlightClass(): string {
    return style.getHighlightLinkClass()
  }

  public async reorderAndSaveAndRender(options: {
    movedWayPoint: Box|NodeWidget
    movedLinkEnd?: LinkEnd
    priority?: RenderPriority
    highlight?: boolean
    draggingInProgress?: boolean
    hoveringOver?: boolean
  }): Promise<void> {
    let newRenderedFromTarget: Box|NodeWidget|undefined
    let newRenderedToTarget: Box|NodeWidget|undefined
    if (options.movedLinkEnd) {
      if (options.movedLinkEnd === this.from) {
        newRenderedFromTarget = options.movedWayPoint
      } else if (options.movedLinkEnd === this.to) {
        newRenderedToTarget = options.movedWayPoint
      } else {
        util.logWarning('Link::reorderAndSaveAndRender(..) movedLinkEnd is neither fromLinkEnd nor toLinkEnd.')
      }
    } else {
      if (this.from.isBoxInPath(options.movedWayPoint)) {
        newRenderedFromTarget = options.movedWayPoint
      }
      if (this.to.isBoxInPath(options.movedWayPoint)) {
        newRenderedToTarget = options.movedWayPoint
      }
    }
    if (!newRenderedFromTarget && !newRenderedToTarget) {
      util.logWarning('Link::reorderAndSaveAndRender(..) movedWayPoint is neither in fromPath nor in toPath.')
    }
    if (!newRenderedFromTarget) {
      newRenderedFromTarget = this.from.getDeepestRenderedWayPoint().linkable
    }
    if (!newRenderedToTarget) {
      newRenderedToTarget = this.to.getDeepestRenderedWayPoint().linkable
    }
    
    const commonAncestor: Box = Box.findCommonAncestor(newRenderedFromTarget, newRenderedToTarget).commonAncestor
    const oldManagingBox: Box = this.managingBox
    this.managingBox = commonAncestor

    await Promise.all([
      this.from.reorderMapDataPathWithoutRender({newManagingBoxForValidation: this.managingBox, movedWayPoint: newRenderedFromTarget}),
      this.to.reorderMapDataPathWithoutRender({newManagingBoxForValidation: this.managingBox, movedWayPoint: newRenderedToTarget})
    ])
    
    const pros: Promise<any>[] = []

    if(oldManagingBox !== this.managingBox) {
      pros.push(BoxLinks.changeManagingBoxOfLinkAndSave(oldManagingBox, this.managingBox, this))
    } else {
      pros.push(this.managingBox.saveMapData())
    }

    pros.push(this.renderWithOptions(options))

    await Promise.all(pros)
  }

  public async getLineInClientCoords(): Promise<{from: ClientPosition, to: ClientPosition}> {
    const fromPosition: Promise<ClientPosition> = this.from.getTargetPositionInClientCoords()
    const toPosition: Promise<ClientPosition> = this.to.getTargetPositionInClientCoords()
    return {
      from: await fromPosition,
      to: await toPosition
    }
  }

  public async getLineInManagingBoxCoords(): Promise<{from: LocalPosition, to: LocalPosition}> {
    const fromPosition: Promise<LocalPosition> = this.from.getTargetPositionInManagingBoxCoords()
    const toPosition: Promise<LocalPosition> = this.to.getTargetPositionInManagingBoxCoords()
    return {
      from: await fromPosition,
      to: await toPosition
    }
  }

  public getTags(): string[] {
    if (!this.data.tags) {
      return []
    }
    return this.data.tags
  }

  public includesTag(tag: string): boolean {
    if (!this.data.tags) {
      return false
    }
    return this.data.tags.includes(tag)
  }

  public async addTag(tag: string): Promise<void> {
    if (this.includesTag(tag)) {
      util.logWarning(`tag '${tag}' is already included in link '${this.getId()}'`)
      return
    }

    if (!this.data.tags) {
      this.data.tags = []
    }
    this.data.tags.push(tag)

    await Promise.all([
      this.render(),
      this.managingBox.saveMapData(),
      this.managingBox.getProjectSettings().countUpLinkTagAndSave(tag)
    ])
  }

  public async removeTag(tag: string): Promise<void> {
    if (!this.includesTag(tag) || !this.data.tags) {
      util.logWarning(`tag '${tag}' is not included in link '${this.getId()}'`)
      return
    }

    this.data.tags.splice(this.data.tags.indexOf(tag), 1)

    await Promise.all([
      this.render(),
      this.managingBox.saveMapData(),
      this.managingBox.getProjectSettings().countDownLinkTagAndSave(tag)
    ])
  }

}

LinkImplementation = Link