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
import { AbstractNodeWidget } from '../AbstractNodeWidget'
import { LinkEndData } from '../mapData/LinkEndData'
import { WayPointData } from '../mapData/WayPointData'
import { selectManager } from '../selectManager'

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
  private hoveringOver: boolean = false // TODO: rename to focused?
  private selected: boolean = false

  public static async newOfEnds(options: {
    from: Box|NodeWidget | {node: Box|NodeWidget, positionInFromNodeCoords?: LocalPosition}
    to: Box|NodeWidget | {node: Box|NodeWidget, positionInToNodeCoords?: LocalPosition}
    managingBox: Box
  }): Promise<Link> {
    const from: {node: Box|NodeWidget, positionInFromNodeCoords?: LocalPosition} = options.from instanceof Box || options.from instanceof NodeWidget
      ? {node: options.from}
      : options.from
    const to: {node: Box|NodeWidget, positionInToNodeCoords?: LocalPosition} = options.to instanceof Box || options.to instanceof NodeWidget
      ? {node: options.to}
      : options.to
    
    const fromWayPoint: WayPointData = WayPointData.new(from.node.getId(), from.node.getName(), from.positionInFromNodeCoords)
    const toWayPoint: WayPointData = WayPointData.new(to.node.getId(), to.node.getName(), to.positionInToNodeCoords)
    const linkData = new LinkData('link'+util.generateId(), new LinkEndData([fromWayPoint]), new LinkEndData([toWayPoint]))
    const link: Link = Link.new(linkData, options.managingBox)

    if (from.node !== options.managingBox) {
      await link.from.reorderMapDataPathWithoutRender({newManagingBoxForValidation: options.managingBox, movedWayPoint: from.node})
    }
    if (to.node !== options.managingBox) {
      await link.to.reorderMapDataPathWithoutRender({newManagingBoxForValidation: options.managingBox, movedWayPoint: to.node})
    }

    return link
  }

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

  public describe(): string {
    const fromPath: string[] = this.getData().from.path.map((wayPoint: WayPointData) => wayPoint.boxName)
    const toPath: string[] = this.getData().to.path.map((wayPoint: WayPointData) => wayPoint.boxName)
    while (fromPath[0] === toPath[0] && fromPath.length > 1 && toPath.length > 1) { // > 1 so that at least one element stays in there
      fromPath.shift()
      toPath.shift()
    }
    return `Link with id '${this.getId()}' in ${this.managingBox.getSrcPath()} (between ${fromPath.join('/')} and ${toPath.join('/')})`
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

  public shouldBeRendered(): boolean {
    return this.getManagingBox().isBodyBeingRendered() && this.from.shouldBeRendered() && this.to.shouldBeRendered()
  }

  private shouldBeRenderedAndLogIfNot(checkpoint: string): boolean {
    if (/*!this.managingBox.isBodyBeingRendered()*/!this.shouldBeRendered()) {
      // can happen while render when Box::onHoverOut() and zooming out at the same time (when there are lots of links) TODO find better solution
      let details = `managingBox.isBodyBeingRendered() is ${this.getManagingBox().isBodyBeingRendered()}`
      details += `, from.shouldBeRendered() is ${this.from.shouldBeRendered()}, to.shouldBeRendered() is ${this.to.shouldBeRendered()}.`
      log.debug(`Link::render(..) (${checkpoint}) called for ${this.describe()} while it should not be rendered. ${details}`)
      return false
    }
    return true
  }

  public async renderWithOptions(options: {
    priority?: RenderPriority
    highlight?: boolean
    draggingInProgress?: boolean
    hoveringOver?: boolean
    selected?: boolean
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
    if (options.selected !== undefined) {
      this.selected = options.selected
    }

    return this.render(options.priority)
  }

  public async render(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    if (/*!this.managingBox.isBodyBeingRendered()*/!this.shouldBeRendered()) {
      let details = `managingBox.isBodyBeingRendered() is ${this.getManagingBox().isBodyBeingRendered()}`
      details += `, from.shouldBeRendered() is ${this.from.shouldBeRendered()}, to.shouldBeRendered() is ${this.to.shouldBeRendered()}.`
      log.warning(`Link::render(..) called for ${this.describe()} while it should not be rendered. ${details}`)
      return
    }
    await this.renderScheduler.schedule(async () => {
    if (/*!this.managingBox.isBodyBeingRendered()*/!this.shouldBeRenderedAndLogIfNot('rescheduled')) {
      return
    }
    this.renderState.setRenderStarted()

    const fromInManagingBoxCoordsPromise: Promise<LocalPosition> = this.from.getRenderPositionInManagingBoxCoords()
    const toInManagingBoxCoords: LocalPosition = await this.to.getRenderPositionInManagingBoxCoords()
    const fromInManagingBoxCoords: LocalPosition = await fromInManagingBoxCoordsPromise

    const lineInnerHtml: string = await this.line.formInnerHtml(fromInManagingBoxCoords, toInManagingBoxCoords, this.draggingInProgress, this.hoveringOver, this.selected)

    const proms: Promise<any>[] = []

    if (!this.renderState.isRendered()) {
      const draggableHtml: string = relocationDragManager.isUsingNativeDragEvents() ? 'draggable="true"' : ''
      const fromHtml: string = `<div id="${this.from.getId()}" ${draggableHtml} class="${style.getHighlightTransitionClass()}"></div>`
      const toHtml: string = `<div id="${this.to.getId()}" ${draggableHtml} class="${style.getHighlightTransitionClass()}"></div>`
      const lineStyle: string = 'position:absolute;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;'
      const lineHtml: string = `<svg id="${this.line.getId()}" style="${lineStyle}">${lineInnerHtml}</svg>`
      if (/*!this.managingBox.isBodyBeingRendered()*/!this.shouldBeRenderedAndLogIfNot('checkpoint0')) {
        return
      }
      await renderManager.setContentTo(this.getId(), lineHtml+fromHtml+toHtml, priority)
      if (/*!this.managingBox.isBodyBeingRendered()*/!this.shouldBeRenderedAndLogIfNot('checkpoint1')) {
        return
      }
      proms.push(this.addEventListeners())
    } else {
      if (/*!this.managingBox.isBodyBeingRendered()*/!this.shouldBeRenderedAndLogIfNot('checkpoint2')) {
        return
      }
      proms.push(renderManager.setContentTo(this.line.getId(), lineInnerHtml, priority))
    }

    // TODO: too many awaits, optimize
    const fromClientPosition: ClientPosition = await this.managingBox.transform.localToClientPosition(fromInManagingBoxCoords)
    const toClientPosition: ClientPosition = await this.managingBox.transform.localToClientPosition(toInManagingBoxCoords)
    const distanceX: number = toClientPosition.x-fromClientPosition.x
    const distanceY: number = toClientPosition.y-fromClientPosition.y
    const angleInRadians: number = Math.atan2(distanceY, distanceX)
    if (/*!this.managingBox.isBodyBeingRendered()*/!this.shouldBeRenderedAndLogIfNot('checkpoint3')) {
      return
    }
    proms.push(this.from.render(fromInManagingBoxCoords, angleInRadians))
    if (/*!this.managingBox.isBodyBeingRendered()*/!this.shouldBeRenderedAndLogIfNot('checkpoint4')) {
      return
    }
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
    await Promise.all([
      HoverManager.addHoverable(this, () => this.handleHoverOver(),() => this.handleHoverOut()),
      selectManager.addSelectable({elementId: this.getId(), onSelect: () => this.handleSelect(), onDeselct: () => this.handleDeselct()}),
      renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForLink(this, new ClientPosition(clientX, clientY)))
    ])
  }

  private async removeEventListeners(): Promise<void> {
    await Promise.all([
      renderManager.removeEventListenerFrom(this.getId(), 'contextmenu'),
      selectManager.removeSelectable(this.getId()),
      HoverManager.removeHoverable(this)
    ])
  }

  private async handleHoverOver(): Promise<void> {
    if (this.renderState.isBeingUnrendered() || !this.getManagingBox().isBodyBeingRendered()) {
      this.highlight = true
      this.hoveringOver = true
      return
    }
    await this.renderWithOptions({priority: RenderPriority.RESPONSIVE, highlight: true, hoveringOver: true})
  }

  private async handleHoverOut(): Promise<void> {
    if (this.renderState.isBeingUnrendered() || !this.getManagingBox().isBodyBeingRendered()) {
      this.highlight = false
      this.hoveringOver = false
      return
    }
    await this.renderWithOptions({priority: RenderPriority.RESPONSIVE, highlight: false, hoveringOver: false})
  }

  private async handleSelect(): Promise<void> {
    if (this.renderState.isBeingUnrendered() || !this.getManagingBox().isBodyBeingRendered()) {
      this.selected = true
      return
    }
    await this.renderWithOptions({priority: RenderPriority.RESPONSIVE, selected: true})
  }

  private async handleDeselct(): Promise<void> {
    if (this.renderState.isBeingUnrendered() || !this.getManagingBox().isBodyBeingRendered()) {
      this.selected = false
      return
    }
    await this.renderWithOptions({priority: RenderPriority.RESPONSIVE, selected: false})
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

  public isAutoMaintained(): boolean {
    return this.includesTag('autoMaintained')
  }

  public setAutoMaintained(value: boolean): Promise<void> {
    if (value) {
      return this.addTag('autoMaintained')
    } else {
      return this.removeTag('autoMaintained')
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