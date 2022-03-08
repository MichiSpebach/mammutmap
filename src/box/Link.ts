import { util } from '../util'
import { renderManager } from '../RenderManager'
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

export class Link implements Hoverable {
  private readonly data: BoxMapLinkData
  private managingBox: Box
  public readonly from: LinkEnd
  public readonly to: LinkEnd
  private rendered: boolean = false
  private highlight: boolean = false

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
      await this.reorderAndSaveWithEndBoxes(this.from.getBorderingBox(), dropTarget)
    } else if (linkEnd === this.from) {
      await this.reorderAndSaveWithEndBoxes(dropTarget, this.to.getBorderingBox())
    } else {
      util.logError('Given LinkEnd is not contained by Link.')
    }
  }

  public async render(draggingInProgress: boolean = false): Promise<void> {
    const fromInManagingBoxCoordsPromise: Promise<LocalPosition> = this.from.getRenderPositionInManagingBoxCoords()
    const toInManagingBoxCoords: LocalPosition = await this.to.getRenderPositionInManagingBoxCoords()
    const fromInManagingBoxCoords: LocalPosition = await fromInManagingBoxCoordsPromise

    const distance: number[] = [toInManagingBoxCoords.percentX-fromInManagingBoxCoords.percentX, toInManagingBoxCoords.percentY-fromInManagingBoxCoords.percentY]
    const angleInRadians: number = Math.atan2(distance[1], distance[0]) // TODO: improve is only correct when managingBox is quadratic

    // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
    // TODO: move coordinates to svg element, svg element only as big as needed?
    const linePositionHtml: string = 'x1="'+fromInManagingBoxCoords.percentX+'%" y1="'+fromInManagingBoxCoords.percentY+'%" x2="'+toInManagingBoxCoords.percentX+'%" y2="'+toInManagingBoxCoords.percentY+'%"'
    const lineHighlightClass: string = this.highlight ? ' '+style.getHighlightClass() : ''
    const lineClassHtml: string = `class="${style.getHighlightTransitionClass()}${lineHighlightClass}"`
    const linePointerEventsStyle: string = draggingInProgress ? '' : 'pointer-events:auto;'
    const lineStyleHtml: string = 'style="stroke:'+style.getLinkColor()+';stroke-width:2px;'+linePointerEventsStyle+'"'
    let lineHtml: string = `<line id="${this.getId()}Line" ${linePositionHtml} ${lineClassHtml} ${lineStyleHtml}/>`
    if (draggingInProgress /*&& (this.from.isFloatToBorder() || this.to.isFloatToBorder())*/) { // TODO: activate floatToBorder option
      const fromTargetInManagingBoxCoordsPromise: Promise<LocalPosition> = this.from.getTargetPositionInManagingBoxCoords()
      const toTargetInManagingBoxCoords: LocalPosition = await this.to.getTargetPositionInManagingBoxCoords()
      const fromTargetInManagingBoxCoords: LocalPosition = await fromTargetInManagingBoxCoordsPromise
      const targetLinePositionHtml: string = 'x1="'+fromTargetInManagingBoxCoords.percentX+'%" y1="'+fromTargetInManagingBoxCoords.percentY+'%" x2="'+toTargetInManagingBoxCoords.percentX+'%" y2="'+toTargetInManagingBoxCoords.percentY+'%"'
      const targetLineHtml: string = `<line ${targetLinePositionHtml} ${lineClassHtml} ${lineStyleHtml} stroke-dasharray="5"/>`
      lineHtml = targetLineHtml+lineHtml
    }

    const proms: Promise<any>[] = []
    if (!this.rendered) {
      const fromHtml: string = '<div id="'+this.from.getId()+'" draggable="true" class="'+style.getHighlightTransitionClass()+'"></div>'
      const toHtml: string = '<div id="'+this.to.getId()+'" draggable="true" class="'+style.getHighlightTransitionClass()+'"></div>'
      const svgHtml: string = '<svg id="'+this.getId()+'svg">'+lineHtml+'</svg>'
      await renderManager.setContentTo(this.getId(), svgHtml+fromHtml+toHtml)
      proms.push(renderManager.setStyleTo(this.getId()+'svg', 'position:absolute;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;'))
      this.registerAtBorderingBoxes()
      proms.push(this.addContextMenu())
      this.rendered = true
    } else {
      proms.push(renderManager.setContentTo(this.getId()+'svg', lineHtml))
    }

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

    this.rendered = false
    await Promise.all(proms)
  }

  private async addContextMenu(): Promise<void> {
    const proms: Promise<any>[] = []

    proms.push(renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForLink(this, clientX, clientY)))
    proms.push(HoverManager.addHoverable(this, () => this.setHighlight(true), () => this.setHighlight(false)))

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
    if (highlight) {
      renderManager.addClassTo(this.getId()+'Line', style.getHighlightClass())
    } else {
      renderManager.removeClassFrom(this.getId()+'Line', style.getHighlightClass())
    }
    this.to.setHighlight(highlight)
    this.from.setHighlight(highlight)
  }

  public async reorderAndSave(): Promise<void|never> {
    await this.reorderAndSaveWithEndBoxes(this.from.getBorderingBox(), this.to.getBorderingBox())
  }

  private async reorderAndSaveWithEndBoxes(fromBox: Box, toBox: Box): Promise<void|never> {
    const fromPosition: ClientPosition = await this.from.getTargetPositionInClientCoords()
    const toPosition: ClientPosition = await this.to.getTargetPositionInClientCoords()
    const relation: {commonAncestor: Box, fromBoxes: Box[], toBoxes: Box[]} = Box.findCommonAncestor(fromBox, toBox)

    const fromWayPoints: Promise<WayPointData>[] = relation.fromBoxes.map(async box => {
      const positionInBoxCoords: LocalPosition = await box.transform.clientToLocalPosition(fromPosition)
      return new WayPointData(box.getId(), box.getName(), positionInBoxCoords.percentX, positionInBoxCoords.percentY)
    })
    const toWayPoints: Promise<WayPointData>[] = relation.toBoxes.map(async box => {
      const positionInBoxCoords: LocalPosition = await box.transform.clientToLocalPosition(toPosition)
      return new WayPointData(box.getId(), box.getName(), positionInBoxCoords.percentX, positionInBoxCoords.percentY)
    })

    this.deregisterAtBorderingBoxes()

    // TODO: WIP unshift into existing WayPointData[] till inner boxId matches (matters when shallow render gets implemented)
    this.data.from.path = await Promise.all(fromWayPoints)
    this.data.to.path = await Promise.all(toWayPoints)

    const oldManagingBox: Box = this.managingBox
    this.managingBox = relation.commonAncestor
    this.registerAtBorderingBoxes()

    if(oldManagingBox !== this.managingBox) {
      BoxLinks.changeManagingBoxOfLinkAndSave(oldManagingBox, this.managingBox, this)
    } else {
      this.managingBox.saveMapData()
    }

    await this.render()
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

}
