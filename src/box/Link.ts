import { util } from '../util'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu/contextMenu'
import { Box } from './Box'
import { BoxLinks } from './BoxLinks'
import { BoxMapLinkData } from './BoxMapLinkData'
import { LinkEnd } from './LinkEnd'
import { Hoverable } from '../Hoverable'
import { HoverManager } from '../HoverManager'
import { ClientPosition, LocalPosition } from './Transform'
import { NodeWidget } from '../node/NodeWidget'

export function override(implementation: typeof LinkImplementation): void {
  LinkImplementation = implementation
}

export let LinkImplementation: typeof Link /*= Link*/ // assigned after declaration at end of file

// important: always extend from LinkImplementation (important for plugins)
export class Link implements Hoverable {
  private readonly data: BoxMapLinkData
  private managingBox: Box
  public readonly from: LinkEnd
  public readonly to: LinkEnd
  private rendered: boolean = false
  private highlight: boolean = false
  private currentStyle: string|null = null
  private styleTimer: NodeJS.Timeout|null = null

  public static new(data: BoxMapLinkData, managingBox: Box, from?: Box|NodeWidget, to?: Box|NodeWidget): Link {
    return new LinkImplementation(data, managingBox, from, to)
  }

  protected constructor(data: BoxMapLinkData, managingBox: Box, from?: Box|NodeWidget, to?: Box|NodeWidget) {
    this.data = data
    this.managingBox = managingBox
    this.from = new LinkEnd(this.data.id+'from', this.data.from, this, 'square', from)
    this.to = new LinkEnd(this.data.id+'to', this.data.to, this, 'arrow', to)
  }

  public getId(): string {
    return this.data.id
  }

  public getData(): BoxMapLinkData {
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

  public async render(priority: RenderPriority = RenderPriority.NORMAL, draggingInProgress: boolean = false, hoveringOver: boolean = false): Promise<void> {
    const fromInManagingBoxCoordsPromise: Promise<LocalPosition> = this.from.getRenderPositionInManagingBoxCoords()
    const toInManagingBoxCoords: LocalPosition = await this.to.getRenderPositionInManagingBoxCoords()
    const fromInManagingBoxCoords: LocalPosition = await fromInManagingBoxCoordsPromise

    const lineHtml: string = await this.formLineHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress, hoveringOver)
    const proms: Promise<any>[] = []

    proms.push(this.updateStyle(priority)) // called before setContentTo(..) to avoid misplacement for short time

    if (!this.rendered) {
      const fromHtml: string = '<div id="'+this.from.getId()+'" draggable="true" class="'+style.getHighlightTransitionClass()+'"></div>'
      const toHtml: string = '<div id="'+this.to.getId()+'" draggable="true" class="'+style.getHighlightTransitionClass()+'"></div>'
      const svgHtml: string = '<svg id="'+this.getId()+'svg">'+lineHtml+'</svg>'
      await renderManager.setContentTo(this.getId(), svgHtml+fromHtml+toHtml, priority)
      proms.push(renderManager.setStyleTo(this.getId()+'svg', 'position:absolute;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;', priority))
      proms.push(this.addEventListeners())
      this.rendered = true
    } else {
      proms.push(renderManager.setContentTo(this.getId()+'svg', lineHtml, priority))
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
  }

  public async unrender(): Promise<void> {
    if(!this.rendered) {
      return
    }

    const proms: Promise<any>[] = []

    proms.push(this.removeEventListeners())
    proms.push(this.from.unrender())
    proms.push(this.to.unrender())
    this.clearStyleTimer()

    this.rendered = false
    await Promise.all(proms)
  }

  private async updateStyle(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    let style: string = '';

    const firstCall: boolean = !this.currentStyle
    const hideTransitionDurationInMs = 1000
    let startDisplayNoneTimer: boolean = false
    if (this.includesTag('hidden')) {
      if (this.highlight) {
        style = 'opacity:0.5;'
      } else if (firstCall) {
        style = 'display:none;'
      } else {
        startDisplayNoneTimer = true
        style = 'transition-duration:'+hideTransitionDurationInMs+'ms;opacity:0;'
      }
    }

    if (this.currentStyle === style) {
      return
    }
    this.currentStyle = style

    this.clearStyleTimer()
    if (startDisplayNoneTimer) {
      this.styleTimer = setTimeout(() => {
        renderManager.setStyleTo(this.getId(), 'display:none;', priority)
        this.styleTimer = null
      }, hideTransitionDurationInMs)
    }

    if (!firstCall || style !== '') {
      await renderManager.setStyleTo(this.getId(), style, priority)
    }
  }

  private clearStyleTimer() {
    if (this.styleTimer) {
      clearTimeout(this.styleTimer)
      this.styleTimer = null
    }
  }

  private async formLineHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, draggingInProgress: boolean, hoveringOver: boolean): Promise<string> {
    // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
    // TODO: move coordinates to svg element, svg element only as big as needed?
    let lineHtml: string = this.formMainLineHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress)
    if ((draggingInProgress || hoveringOver) /*&& (this.from.isFloatToBorder() || this.to.isFloatToBorder())*/) { // TODO: activate floatToBorder option
      lineHtml = await this.formTargetLineHtml(draggingInProgress) + lineHtml
    }
    return lineHtml
  }

  private formMainLineHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, draggingInProgress: boolean): string {
    const positionHtml: string = 'x1="'+fromInManagingBoxCoords.percentX+'%" y1="'+fromInManagingBoxCoords.percentY+'%" x2="'+toInManagingBoxCoords.percentX+'%" y2="'+toInManagingBoxCoords.percentY+'%"'
    return `<line id="${this.getId()}Line" ${positionHtml} ${this.formLineClassHtml()} ${this.formLineStyleHtml(draggingInProgress)}/>`
  }

  private async formTargetLineHtml(draggingInProgress: boolean): Promise<string> {
    const fromTargetInManagingBoxCoordsPromise: Promise<LocalPosition> = this.from.getTargetPositionInManagingBoxCoords()
    const toTargetInManagingBoxCoords: LocalPosition = await this.to.getTargetPositionInManagingBoxCoords()
    const fromTargetInManagingBoxCoords: LocalPosition = await fromTargetInManagingBoxCoordsPromise
    const positionHtml: string = 'x1="'+fromTargetInManagingBoxCoords.percentX+'%" y1="'+fromTargetInManagingBoxCoords.percentY+'%" x2="'+toTargetInManagingBoxCoords.percentX+'%" y2="'+toTargetInManagingBoxCoords.percentY+'%"'
    return `<line id="${this.getId()}TargetLine" ${positionHtml} ${this.formLineClassHtml()} ${this.formLineStyleHtml(draggingInProgress)} stroke-dasharray="5"/>`
  }

  private formLineClassHtml(): string {
    const highlightClass: string = this.highlight ? ' '+this.getHighlightClass() : ''
    return `class="${style.getHighlightTransitionClass()}${highlightClass}"`
  }

  private formLineStyleHtml(draggingInProgress: boolean): string {
    const pointerEventsStyle: string = draggingInProgress ? '' : 'pointer-events:auto;'
    return 'style="stroke:'+this.getColor()+';stroke-width:2px;'+pointerEventsStyle+'"'
  }

  public getColor(): string {
    return style.getLinkColor()
  }

  private async addEventListeners(): Promise<void> {
    const proms: Promise<any>[] = []
    proms.push(renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForLink(this, clientX, clientY)))
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
    if (!this.rendered) {
      util.logWarning('handleHoverHover() called on link with id '+this.getId()+' altough link is not rendered.')
      return
    }
    const proms: Promise<any>[] = []
    proms.push(this.setHighlight(true))
    proms.push(this.render(RenderPriority.RESPONSIVE, false, true))
    await Promise.all(proms)
  }

  private async handleHoverOut(): Promise<void> {
    if (!this.rendered) {
      util.logWarning('handleHoverOut() called on link with id '+this.getId()+' altough link is not rendered.')
      return
    }
    const proms: Promise<any>[] = []
    proms.push(this.setHighlight(false))
    proms.push(this.render(RenderPriority.RESPONSIVE, false, false))
    await Promise.all(proms)
  }

  public async setHighlight(highlight: boolean): Promise<void> {
    this.highlight = highlight

    if (!this.rendered) {
      util.logWarning('setHighlight(..) called although Link is not rendered yet.')
      return // TODO: trigger rerender when renderInProgress
    }

    const highlightClass: string = this.getHighlightClass()
    const proms: Promise<any>[] = []
    if (highlight) {
      proms.push(renderManager.addClassTo(this.getId()+'svg', highlightClass))
      proms.push(renderManager.addClassTo(this.getId()+'Line', highlightClass))
    } else {
      proms.push(renderManager.removeClassFrom(this.getId()+'svg', highlightClass))
      proms.push(renderManager.removeClassFrom(this.getId()+'Line', highlightClass))
    }
    proms.push(this.updateStyle())
    proms.push(this.to.setHighlight(highlight))
    proms.push(this.from.setHighlight(highlight))

    await Promise.all(proms)
  }

  public getHighlightClass(): string {
    return style.getHighlightLinkClass()
  }

  public async reorderAndSave(): Promise<void> {
    const commonAncestor: Box = Box.findCommonAncestor(this.from.getRenderedTargetBox(), this.to.getRenderedTargetBox()).commonAncestor
    const oldManagingBox: Box = this.managingBox
    this.managingBox = commonAncestor

    let proms: Promise<any>[] = []
    proms.push(this.from.reorderMapDataPathWithoutRender(this.managingBox))
    proms.push(this.to.reorderMapDataPathWithoutRender(this.managingBox))
    await Promise.all(proms)

    proms = []
    if(oldManagingBox !== this.managingBox) {
      proms.push(BoxLinks.changeManagingBoxOfLinkAndSave(oldManagingBox, this.managingBox, this))
    } else {
      proms.push(this.managingBox.saveMapData())
    }
    proms.push(this.render())
    await Promise.all(proms)
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