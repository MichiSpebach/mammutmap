import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { FolderBox } from './FolderBox'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPointData } from './WayPointData'
import { WayPoint } from './WayPoint'
import { Rect } from '../Rect'

export class Link {
  private data: BoxMapLinkData
  private base: FolderBox
  private fromWayPoint: WayPoint
  private toWayPoint: WayPoint
  private rendered: boolean = false

  public constructor(data: BoxMapLinkData, base: FolderBox) {
    this.data = data
    this.base = base
    this.fromWayPoint = new WayPoint(this.data.id+'from', data.fromWayPoints[0], this, 'square')
    this.toWayPoint = new WayPoint(this.data.id+'to', data.toWayPoints[0], this, 'arrow')
  }

  public async render(): Promise<void> {
    const baseRect: Rect = await this.base.getClientRect() // TODO: optimize, gather awaits for more performance
    const fromInBaseCoords: {x: number, y: number} = await this.getWayPointPositionInBaseCoords(this.fromWayPoint.getData(), baseRect) // TODO: optimize, gather awaits for more performance
    const toInBaseCoords: {x: number, y: number} = await this.getWayPointPositionInBaseCoords(this.toWayPoint.getData(), baseRect) // TODO: optimize, gather awaits for more performance

    return this.renderAtPosition(fromInBaseCoords, toInBaseCoords)
  }

  public async renderWayPointAtPosition(wayPoint: WayPoint, clientX: number, clientY: number): Promise<void> {
    if (wayPoint !== this.toWayPoint) {
      util.logError('Given WayPoint is not contained by Link.')
    }

    const from: WayPointData = this.data.fromWayPoints[0]
    const baseRect: Rect = await this.base.getClientRect() // TODO: optimize, use cached?
    const fromInBaseCoords: {x: number, y: number} = await this.getWayPointPositionInBaseCoords(from, baseRect)
    const newToInBaseCoords: {x: number, y: number} = await this.base.transformClientPositionToLocal(clientX, clientY)

    await this.renderAtPosition(fromInBaseCoords, newToInBaseCoords)
  }

  // TODO: refactor, simplify, only needs wayPoint and dropTarget as argument
  public async renderWayPointAtPositionAndSave(wayPoint: WayPoint, clientX: number, clientY: number, dropTarget: Box): Promise<void> {
    if (wayPoint !== this.toWayPoint) {
      util.logError('Given WayPoint is not contained by Link.')
    }

    const to: WayPointData = this.data.toWayPoints[0]
    to.boxId = dropTarget.getId()

    if (!this.base.containsBox(dropTarget)) { // TODO: condition not needed
      await this.reorder(this.fromWayPoint.getDropTargetAtDragStart(), dropTarget)
    }

    // TODO: not needed from here
    const newPositionInDropTargetCoords: {x: number, y: number} = await dropTarget.transformClientPositionToLocal(clientX, clientY)

    to.x = newPositionInDropTargetCoords.x
    to.y = newPositionInDropTargetCoords.y

    await this.render()
    // TODO: not needed till here
    await this.base.saveMapData()
  }

  private async renderAtPosition(fromInBaseCoords: {x: number, y: number}, toInBaseCoords: {x: number, y: number}): Promise<void> {
    const distanceInPixel: number[] = [toInBaseCoords.x-fromInBaseCoords.x, toInBaseCoords.y-fromInBaseCoords.y]
    const angleInRadians: number = Math.atan2(distanceInPixel[1], distanceInPixel[0])

    // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
    // TODO: move coordinates to svg element, svg element only as big as needed?
    const linePositionHtml: string = 'x1="'+fromInBaseCoords.x+'%" y1="'+fromInBaseCoords.y+'%" x2="'+toInBaseCoords.x+'%" y2="'+toInBaseCoords.y+'%"'
    const lineHtml: string = '<line '+linePositionHtml+' style="stroke:blue;stroke-width:2px;"/>'

    if (this.rendered === false) {
      const fromWayPointHtml: string = '<div id="'+this.fromWayPoint.getId()+'" draggable="true"></div>'
      const toWayPointHtml: string = '<div id="'+this.toWayPoint.getId()+'" draggable="true"></div>'
      await dom.addContentTo(this.base.getId(), '<svg id="'+this.data.id+'">'+lineHtml+'</svg>'+fromWayPointHtml+toWayPointHtml)
      this.rendered = true
    } else {
      await dom.setContentTo(this.data.id, lineHtml)
    }

    await dom.setStyleTo(this.data.id, 'position:absolute;top:0;width:100%;height:100%;pointer-events:none;')
    const fromBox: Box = this.getBox(this.fromWayPoint.getData().boxId)
    await this.fromWayPoint.render(fromBox, fromInBaseCoords.x, fromInBaseCoords.y, angleInRadians)
    const toBox: Box = this.getBox(this.toWayPoint.getData().boxId)
    await this.toWayPoint.render(toBox, toInBaseCoords.x, toInBaseCoords.y, angleInRadians) // TODO: gather awaits for more performance
  }

  private async getWayPointPositionInBaseCoords(wayPoint: WayPointData, baseRect: Rect): Promise<{x: number; y: number}> {
    const box: Box = this.getBox(wayPoint.boxId)
    const rect: Rect = await box.getClientRect()

    const xInPixel: number = wayPoint.x * rect.width / 100
    const yInPixel: number = wayPoint.y * rect.height / 100

    const xInBaseCoordsInPixel: number = rect.x + xInPixel - baseRect.x
    const yInBaseCoordsInPixel: number = rect.y + yInPixel - baseRect.y

    return {x: xInBaseCoordsInPixel / baseRect.width * 100, y: yInBaseCoordsInPixel / baseRect.height * 100}
  }

  private getBox(boxIdFromWayPoint: string) {
    if (boxIdFromWayPoint === WayPointData.THIS_BOX_ID) {
      return this.base
    }
    return this.base.getChild(boxIdFromWayPoint)
  }

  private async reorder(fromBox: Box, toBox: Box): Promise<void | never> {
    const fromClientPosition: {x: number, y: number} = await this.fromWayPoint.getClientPosition()
    const toClientPosition: {x: number, y: number} = await this.toWayPoint.getClientPosition()
    const relation: {commonAncestor: FolderBox, fromBoxes: Box[], toBoxes: Box[]} = this.findCommonAncestor(fromBox, toBox)

    const fromWayPoints: Promise<WayPointData>[] = relation.fromBoxes.map(async box => {
      const positionInBoxCoords: {x: number, y: number} = await box.transformClientPositionToLocal(fromClientPosition.x, fromClientPosition.y)
      return new WayPointData(box.getId(), positionInBoxCoords.x, positionInBoxCoords.y)
    })
    const toWayPoints: Promise<WayPointData>[] = relation.toBoxes.map(async box => {
      const positionInBoxCoords: {x: number, y: number} = await box.transformClientPositionToLocal(toClientPosition.x, toClientPosition.y)
      return new WayPointData(box.getId(), positionInBoxCoords.x, positionInBoxCoords.y)
    })

    // TODO: WIP unshift into existing WayPointData[] till inner boxId matches
    this.data.fromWayPoints = await Promise.all(fromWayPoints)
    this.data.toWayPoints = await Promise.all(toWayPoints)

    // TODO: WIP move link elements to new baseBox if base changes

    this.base = relation.commonAncestor
  }

  private findCommonAncestor(fromBox: Box, toBox: Box): {commonAncestor: FolderBox, fromBoxes: Box[], toBoxes: Box[]} | never {
    const fromBoxes: Box[] = [fromBox]
    const toBoxes: Box[] = [toBox]

    let commonAncestorCandidate: Box = fromBox
    while (fromBoxes[0] !== toBoxes[0]) {
      if (fromBoxes[0].isRoot() && toBoxes[0].isRoot()) {
        util.logError(fromBox.getSrcPath()+' and '+toBox.getSrcPath()+' do not have a common ancestor, file structure seems to be corrupted.')
      }

      if (!fromBoxes[0].isRoot()) {
        commonAncestorCandidate = fromBoxes[0].getParent()
        fromBoxes.unshift(commonAncestorCandidate)
        if (toBoxes.includes(commonAncestorCandidate)) {
          fromBoxes.shift()
          toBoxes.shift()
          break
        }
      }

      if (!toBoxes[0].isRoot()) {
        commonAncestorCandidate = toBoxes[0].getParent()
        toBoxes.unshift(commonAncestorCandidate)
        if (fromBoxes.includes(commonAncestorCandidate)) {
          fromBoxes.shift()
          toBoxes.shift()
          break
        }
      }
    }

    if (commonAncestorCandidate instanceof FolderBox) {
      return {commonAncestor: commonAncestorCandidate, fromBoxes: fromBoxes, toBoxes: toBoxes}
    } else {
      const errorExplanation: string = 'This can only occur if fromBox === toBox and fromBox is not a FolderBox. This is impossible if method is called correctly.'
      util.logError('expected '+commonAncestorCandidate.getSrcPath()+' to be a FolderBox, but was not. '+errorExplanation)
    }
  }

}
