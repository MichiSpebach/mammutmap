import * as util from '../util'
import * as dom from '../domAdapter'
import { style } from '../styleAdapter'
import { boxManager } from './BoxManager'
import { Box } from './Box'
import { BoxLinks } from './BoxLinks'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPointData } from './WayPointData'
import { LinkEnd } from './LinkEnd'
import { Rect } from '../Rect'

export class Link {
  private readonly data: BoxMapLinkData
  private managingBox: Box
  private readonly from: LinkEnd
  private readonly to: LinkEnd
  private rendered: boolean = false

  public constructor(data: BoxMapLinkData, managingBox: Box) {
    this.data = data
    this.managingBox = managingBox
    this.from = new LinkEnd(this.data.id+'from', this, 'square')
    this.to = new LinkEnd(this.data.id+'to', this, 'arrow')
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

  public getFrom(): LinkEnd {
    return this.from
  }

  public getTo(): LinkEnd {
    return this.to
  }

  public async render(): Promise<void> {
    const baseRect: Rect = await this.managingBox.getClientRect() // TODO: optimize, gather awaits for more performance
    const fromInBaseCoords: {x: number, y: number} = await this.getDeepestRenderedWayPointPositionInBaseCoords(this.data.fromWayPoints, baseRect) // TODO: optimize, gather awaits for more performance
    const toInBaseCoords: {x: number, y: number} = await this.getDeepestRenderedWayPointPositionInBaseCoords(this.data.toWayPoints, baseRect) // TODO: optimize, gather awaits for more performance

    return this.renderAtPosition(fromInBaseCoords, toInBaseCoords)
  }

  public async renderLinkEndAtPosition(linkEnd: LinkEnd, clientX: number, clientY: number): Promise<void> {
    const baseRect: Rect = await this.managingBox.getClientRect() // TODO: optimize, use cached?

    let fromInBaseCoords: {x: number, y: number}
    let toInBaseCoords: {x: number, y: number}
    if (linkEnd === this.to) {
      fromInBaseCoords = await this.getDeepestRenderedWayPointPositionInBaseCoords(this.data.fromWayPoints, baseRect)
      toInBaseCoords = await this.managingBox.transformClientPositionToLocal(clientX, clientY)
    } else if (linkEnd === this.from) {
      fromInBaseCoords = await this.managingBox.transformClientPositionToLocal(clientX, clientY)
      toInBaseCoords = await this.getDeepestRenderedWayPointPositionInBaseCoords(this.data.toWayPoints, baseRect)
    } else {
      util.logError('Given LinkEnd is not contained by Link.')
    }

    await this.renderAtPosition(fromInBaseCoords, toInBaseCoords)
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

  private async renderAtPosition(fromInBaseCoords: {x: number, y: number}, toInBaseCoords: {x: number, y: number}): Promise<void> {
    const distanceInPixel: number[] = [toInBaseCoords.x-fromInBaseCoords.x, toInBaseCoords.y-fromInBaseCoords.y]
    const angleInRadians: number = Math.atan2(distanceInPixel[1], distanceInPixel[0])

    // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
    // TODO: move coordinates to svg element, svg element only as big as needed?
    const linePositionHtml: string = 'x1="'+fromInBaseCoords.x+'%" y1="'+fromInBaseCoords.y+'%" x2="'+toInBaseCoords.x+'%" y2="'+toInBaseCoords.y+'%"'
    const lineHtml: string = '<line id="'+this.getId()+'line" '+linePositionHtml+' style="stroke:'+style.getLinkColor()+';stroke-width:2px;"/>'

    if (!this.rendered) {
      const fromHtml: string = '<div id="'+this.from.getId()+'" draggable="true"></div>'
      const toHtml: string = '<div id="'+this.to.getId()+'" draggable="true"></div>'
      const svgHtml: string = '<svg id="'+this.getId()+'svg">'+lineHtml+'</svg>'
      await dom.addContentTo(this.managingBox.getId(), '<div id="'+this.getId()+'">'+svgHtml+fromHtml+toHtml+'</div>')
      await dom.setStyleTo(this.getId()+'svg', 'position:absolute;top:0;width:100%;height:100%;pointer-events:none;')
      this.registerAtBorderingBoxes()
      this.rendered = true
    } else {
      await dom.setContentTo(this.getId()+'svg', lineHtml)
    }

    const fromBox: Box = this.getDeepestRenderedBox(this.data.fromWayPoints).box
    await this.from.render(fromBox, fromInBaseCoords.x, fromInBaseCoords.y, angleInRadians)
    const toBox: Box = this.getDeepestRenderedBox(this.data.toWayPoints).box
    await this.to.render(toBox, toInBaseCoords.x, toInBaseCoords.y, angleInRadians) // TODO: gather awaits for more performance
  }

  public async setHighlight(highlight: boolean): Promise<void> {
    if (!this.rendered) {
      util.logWarning('setHighlight(..) called although Link is not rendered yet.')
    }

    if (highlight) {
      dom.addClassTo(this.getId()+'line', style.getHighlightClass())
    } else {
      dom.removeClassFrom(this.getId()+'line', style.getHighlightClass())
    }
    this.to.setHighlight(highlight)
    this.from.setHighlight(highlight)
  }

  private async getDeepestRenderedWayPointPositionInBaseCoords(path: WayPointData[], baseRect: Rect): Promise<{x: number; y: number}> {
    const deepestRendered: {box: Box, wayPoint: WayPointData} = this.getDeepestRenderedBox(path)
    const rect: Rect = await deepestRendered.box.getClientRect()

    const xInPixel: number = deepestRendered.wayPoint.x * rect.width / 100
    const yInPixel: number = deepestRendered.wayPoint.y * rect.height / 100

    const xInBaseCoordsInPixel: number = rect.x + xInPixel - baseRect.x
    const yInBaseCoordsInPixel: number = rect.y + yInPixel - baseRect.y

    return {x: xInBaseCoordsInPixel / baseRect.width * 100, y: yInBaseCoordsInPixel / baseRect.height * 100}
  }

  private getDeepestRenderedBox(path: WayPointData[]): {box: Box, wayPoint: WayPointData} | never {
    const renderedBoxes: {box: Box, wayPoint: WayPointData}[] = this.getRenderedBoxes(path)
    return renderedBoxes[renderedBoxes.length-1]
  }

  private getRenderedBoxes(path: WayPointData[]): {box: Box, wayPoint: WayPointData}[] | never {
    if (path.length === 0) {
      util.logError(this.managingBox.getSrcPath()+' has empty link path.')
    }

    const renderedBoxesInPath: {box: Box, wayPoint: WayPointData}[] = []

    for(let i = 0; i < path.length; i++) {
      const box: Box|undefined = boxManager.getBoxIfExists(path[i].boxId)
      if (box instanceof Box) { // TODO: also check if box is rendered
        renderedBoxesInPath.push({box: box, wayPoint: path[i]})
      }
    }

    return renderedBoxesInPath
  }

  public async reorderAndSave(): Promise<void|never> {
    await this.reorderAndSaveWithEndBoxes(this.from.getBorderingBox(), this.to.getBorderingBox())
  }

  private async reorderAndSaveWithEndBoxes(fromBox: Box, toBox: Box): Promise<void|never> {
    const fromClientPosition: {x: number, y: number} = await this.from.getClientMidPosition()
    const toClientPosition: {x: number, y: number} = await this.to.getClientMidPosition()
    const relation: {commonAncestor: Box, fromBoxes: Box[], toBoxes: Box[]} = this.findCommonAncestor(fromBox, toBox)

    const fromWayPoints: Promise<WayPointData>[] = relation.fromBoxes.map(async box => {
      const positionInBoxCoords: {x: number, y: number} = await box.transformClientPositionToLocal(fromClientPosition.x, fromClientPosition.y)
      return new WayPointData(box.getId(), box.getName(), positionInBoxCoords.x, positionInBoxCoords.y)
    })
    const toWayPoints: Promise<WayPointData>[] = relation.toBoxes.map(async box => {
      const positionInBoxCoords: {x: number, y: number} = await box.transformClientPositionToLocal(toClientPosition.x, toClientPosition.y)
      return new WayPointData(box.getId(), box.getName(), positionInBoxCoords.x, positionInBoxCoords.y)
    })

    this.deregisterAtBorderingBoxes()

    // TODO: WIP unshift into existing WayPointData[] till inner boxId matches (matters when shallow render gets implemented)
    this.data.fromWayPoints = await Promise.all(fromWayPoints)
    this.data.toWayPoints = await Promise.all(toWayPoints)

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
    this.getRenderedBoxesWithoutBase(this.data.fromWayPoints).forEach((box: Box) => box.registerBorderingLink(this))
    this.getRenderedBoxesWithoutBase(this.data.toWayPoints).forEach((box: Box) => box.registerBorderingLink(this))
  }

  private deregisterAtBorderingBoxes(): void {
    this.getRenderedBoxesWithoutBase(this.data.fromWayPoints).forEach((box: Box) => box.deregisterBorderingLink(this))
    this.getRenderedBoxesWithoutBase(this.data.toWayPoints).forEach((box: Box) => box.deregisterBorderingLink(this))
  }

  private getRenderedBoxesWithoutBase(path: WayPointData[]): Box[] {
    return this.getRenderedBoxes(path).map((tuple: {box: Box, wayPoint: WayPointData}) => tuple.box).filter(box => box !== this.managingBox)
  }

  private findCommonAncestor(fromBox: Box, toBox: Box): {commonAncestor: Box, fromBoxes: Box[], toBoxes: Box[]} | never {
    const fromBoxes: Box[] = [fromBox]
    const toBoxes: Box[] = [toBox]

    let commonAncestorCandidate: Box = fromBox
    while (fromBoxes[0] !== toBoxes[0]) {
      if (fromBoxes[0].isRoot() && toBoxes[0].isRoot()) {
        util.logError(fromBox.getSrcPath()+' and '+toBox.getSrcPath()+' do not have a common ancestor, file structure seems to be corrupted.')
      }

      if (!fromBoxes[0].isRoot()) {
        commonAncestorCandidate = fromBoxes[0].getParent()
        if (toBoxes.includes(commonAncestorCandidate)) {
          toBoxes.splice(0, Math.min(toBoxes.indexOf(commonAncestorCandidate)+1, toBoxes.length-1))
          break
        } else {
          fromBoxes.unshift(commonAncestorCandidate)
        }
      }

      if (!toBoxes[0].isRoot()) {
        commonAncestorCandidate = toBoxes[0].getParent()
        if (fromBoxes.includes(commonAncestorCandidate)) {
          fromBoxes.splice(0, Math.min(fromBoxes.indexOf(commonAncestorCandidate)+1, fromBoxes.length-1))
          break
        } else {
          toBoxes.unshift(commonAncestorCandidate)
        }
      }
    }

    return {commonAncestor: commonAncestorCandidate, fromBoxes: fromBoxes, toBoxes: toBoxes}
  }

}
