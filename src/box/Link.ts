import { util } from '../util'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu'
import { Box } from './Box'
import { BoxLinks } from './BoxLinks'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPointData } from './WayPointData'
import { LinkEnd } from './LinkEnd'
import { Hoverable } from '../Hoverable'
import { HoverManager } from '../HoverManager'
import { ClientPosition, LocalPosition } from './Transform'
import * as linkUtil from './linkUtil'

export class Link implements Hoverable {
  private readonly data: BoxMapLinkData
  private managingBox: Box
  public readonly from: LinkEnd
  public readonly to: LinkEnd
  private rendered: boolean = false
  private highlight: boolean = false
  private currentStyle: string|null = null
  private styleTimer: NodeJS.Timeout|null = null

  public constructor(data: BoxMapLinkData, managingBox: Box) {
    this.data = data
    this.managingBox = managingBox
    this.from = new LinkEnd(this.data.id+'from', this.data.from, this, 'square')
    this.to = new LinkEnd(this.data.id+'to', this.data.to, this, 'arrow')
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

  public async renderLinkEndInDropTargetAndSave(linkEnd: LinkEnd, dropTarget: Box): Promise<void> {
    if (linkEnd === this.to) {
      await this.reorderAndSaveWithEndBoxes({box: this.from.getBorderingBox(), changed: false}, {box: dropTarget, changed: true})
    } else if (linkEnd === this.from) {
      await this.reorderAndSaveWithEndBoxes({box: dropTarget, changed: true}, {box: this.to.getBorderingBox(), changed: false})
    } else {
      util.logError('Given LinkEnd is not contained by Link.')
    }
  }

  public async render(priority: RenderPriority = RenderPriority.NORMAL, draggingInProgress: boolean = false, hoveringOver: boolean = false): Promise<void> {
    const fromInManagingBoxCoordsPromise: Promise<LocalPosition> = this.from.getRenderPositionInManagingBoxCoords()
    const toInManagingBoxCoords: LocalPosition = await this.to.getRenderPositionInManagingBoxCoords()
    const fromInManagingBoxCoords: LocalPosition = await fromInManagingBoxCoordsPromise

    const lineHtml: string = await this.formLineHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress, hoveringOver)
    const proms: Promise<any>[] = []

    if (!this.rendered) {
      const fromHtml: string = '<div id="'+this.from.getId()+'" draggable="true" class="'+style.getHighlightTransitionClass()+'"></div>'
      const toHtml: string = '<div id="'+this.to.getId()+'" draggable="true" class="'+style.getHighlightTransitionClass()+'"></div>'
      const svgHtml: string = '<svg id="'+this.getId()+'svg">'+lineHtml+'</svg>'
      await renderManager.setContentTo(this.getId(), svgHtml+fromHtml+toHtml, priority)
      proms.push(renderManager.setStyleTo(this.getId()+'svg', 'position:absolute;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;', priority))
      this.registerAtBorderingBoxes()
      proms.push(this.addContextMenu())
      this.rendered = true
    } else {
      proms.push(renderManager.setContentTo(this.getId()+'svg', lineHtml, priority))
    }

    proms.push(this.updateStyle(priority))

    const distance: number[] = [toInManagingBoxCoords.percentX-fromInManagingBoxCoords.percentX, toInManagingBoxCoords.percentY-fromInManagingBoxCoords.percentY]
    const angleInRadians: number = Math.atan2(distance[1], distance[0]) // TODO: improve is only correct when managingBox is quadratic, use clientCoords?
    const fromBox: Box = this.from.getDeepestRenderedBox().box
    proms.push(this.from.render(fromBox, fromInManagingBoxCoords, angleInRadians))
    const toBox: Box = this.to.getDeepestRenderedBox().box
    proms.push(this.to.render(toBox, toInManagingBoxCoords, angleInRadians))

    await Promise.all(proms)
  }

  public async unrender(): Promise<void> {
    if(!this.rendered) {
      return
    }

    const proms: Promise<any>[] = []

    proms.push(this.removeContextMenu())
    this.deregisterAtBorderingBoxes()
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
    const highlightClass: string = this.highlight ? ' '+style.getHighlightClass() : ''
    return `class="${style.getHighlightTransitionClass()}${highlightClass}"`
  }

  private formLineStyleHtml(draggingInProgress: boolean): string {
    const pointerEventsStyle: string = draggingInProgress ? '' : 'pointer-events:auto;'
    return 'style="stroke:'+style.getLinkColor()+';stroke-width:2px;'+pointerEventsStyle+'"'
  }

  private async addContextMenu(): Promise<void> {
    const proms: Promise<any>[] = []

    proms.push(renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForLink(this, clientX, clientY)))
    proms.push(HoverManager.addHoverable(
      this,
      () => {
        this.setHighlight(true)
        this.render(RenderPriority.RESPONSIVE, false, true)
      },
      () => {
        this.setHighlight(false)
        this.render(RenderPriority.RESPONSIVE, false, false)
      }
    ))

    await Promise.all(proms)
  }

  private async removeContextMenu(): Promise<void> {
    const proms: Promise<any>[] = []

    proms.push(HoverManager.removeHoverable(this))
    proms.push(renderManager.removeEventListenerFrom(this.getId(), 'contextmenu'))

    await Promise.all(proms)
  }

  public async setHighlight(highlight: boolean): Promise<void> {
    if (!this.rendered) {
      util.logWarning('setHighlight(..) called although Link is not rendered yet.')
    }

    this.highlight = highlight

    const proms: Promise<any>[] = []
    if (highlight) {
      proms.push(renderManager.addClassTo(this.getId()+'Line', style.getHighlightClass()))
    } else {
      proms.push(renderManager.removeClassFrom(this.getId()+'Line', style.getHighlightClass()))
    }
    proms.push(this.updateStyle())
    proms.push(this.to.setHighlight(highlight))
    proms.push(this.from.setHighlight(highlight))

    await Promise.all(proms)
  }

  public async reorderAndSave(): Promise<void|never> {
    await this.reorderAndSaveWithEndBoxes({box: this.from.getBorderingBox(), changed: false}, {box: this.to.getBorderingBox(), changed: false})
  }

  private async reorderAndSaveWithEndBoxes(from: {box: Box, changed: boolean}, to: {box: Box, changed: boolean}): Promise<void|never> {
    const fromPosition: ClientPosition = await this.from.getTargetPositionInClientCoords()
    const toPosition: ClientPosition = await this.to.getTargetPositionInClientCoords()
    const relation: {commonAncestor: Box, fromBoxes: Box[], toBoxes: Box[]} = Box.findCommonAncestor(from.box, to.box)

    const fromWayPoints: Promise<WayPointData>[] = relation.fromBoxes.map(async box => {
      const positionInBoxCoords: LocalPosition = await box.transform.clientToLocalPosition(fromPosition)
      return new WayPointData(box.getId(), box.getName(), positionInBoxCoords.percentX, positionInBoxCoords.percentY)
    })
    const toWayPoints: Promise<WayPointData>[] = relation.toBoxes.map(async box => {
      const positionInBoxCoords: LocalPosition = await box.transform.clientToLocalPosition(toPosition)
      return new WayPointData(box.getId(), box.getName(), positionInBoxCoords.percentX, positionInBoxCoords.percentY)
    })

    this.deregisterAtBorderingBoxes()

    if (from.changed) {
      this.data.from.path = await Promise.all(fromWayPoints)
    } else {
      this.data.from.path = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(this.data.from.path, await Promise.all(fromWayPoints))
    }
    if (to.changed) {
      this.data.to.path = await Promise.all(toWayPoints)
    } else {
      this.data.to.path = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(this.data.to.path, await Promise.all(toWayPoints))
    }

    const oldManagingBox: Box = this.managingBox
    this.managingBox = relation.commonAncestor
    this.registerAtBorderingBoxes()

    const proms: Promise<any>[] = []
    if(oldManagingBox !== this.managingBox) {
      proms.push(BoxLinks.changeManagingBoxOfLinkAndSave(oldManagingBox, this.managingBox, this))
    } else {
      proms.push(this.managingBox.saveMapData())
    }
    proms.push(this.render())
    await Promise.all(proms)
  }

  private registerAtBorderingBoxes(): void {
    this.from.getRenderedBoxesWithoutManagingBox().forEach((box: Box) => box.registerBorderingLink(this))
    this.to.getRenderedBoxesWithoutManagingBox().forEach((box: Box) => box.registerBorderingLink(this))
  }

  private deregisterAtBorderingBoxes(): void {
    this.from.getRenderedBoxesWithoutManagingBox().forEach((box: Box) => box.deregisterBorderingLink(this))
    this.to.getRenderedBoxesWithoutManagingBox().forEach((box: Box) => box.deregisterBorderingLink(this))
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
    await this.render()
    await this.managingBox.saveMapData()
  }

  public async removeTag(tag: string): Promise<void> {
    if (!this.includesTag(tag) || !this.data.tags) {
      util.logWarning(`tag '${tag}' is not included in link '${this.getId()}'`)
      return
    }
    this.data.tags.splice(this.data.tags.indexOf(tag), 1)
    await this.render()
    await this.managingBox.saveMapData()
  }

}
