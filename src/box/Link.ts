import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { FolderBox } from './FolderBox'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPointData } from './WayPointData'
import { LinkEnd } from './LinkEnd'
import { Rect } from '../Rect'

export class Link {
  private data: BoxMapLinkData
  private base: FolderBox // TODO: rename to managingBox?
  private from: LinkEnd
  private to: LinkEnd
  private rendered: boolean = false

  public constructor(data: BoxMapLinkData, base: FolderBox) {
    this.data = data
    this.base = base
    this.from = new LinkEnd(this.data.id+'from', this, 'square')
    this.to = new LinkEnd(this.data.id+'to', this, 'arrow')
  }

  public getId(): string {
    return this.data.id
  }

  public getData(): BoxMapLinkData {
    return this.data
  }

  public getBase(): FolderBox {
    return this.base
  }

  public async render(): Promise<void> {
    const baseRect: Rect = await this.base.getClientRect() // TODO: optimize, gather awaits for more performance
    const fromInBaseCoords: {x: number, y: number} = await this.getDeepestRenderedWayPointPositionInBaseCoords(this.data.fromWayPoints, baseRect) // TODO: optimize, gather awaits for more performance
    const toInBaseCoords: {x: number, y: number} = await this.getDeepestRenderedWayPointPositionInBaseCoords(this.data.toWayPoints, baseRect) // TODO: optimize, gather awaits for more performance

    return this.renderAtPosition(fromInBaseCoords, toInBaseCoords)
  }

  public async renderLinkEndAtPosition(linkEnd: LinkEnd, clientX: number, clientY: number): Promise<void> {
    const baseRect: Rect = await this.base.getClientRect() // TODO: optimize, use cached?

    let fromInBaseCoords: {x: number, y: number}
    let toInBaseCoords: {x: number, y: number}
    if (linkEnd === this.to) {
      fromInBaseCoords = await this.getDeepestRenderedWayPointPositionInBaseCoords(this.data.fromWayPoints, baseRect)
      toInBaseCoords = await this.base.transformClientPositionToLocal(clientX, clientY)
    } else if (linkEnd === this.from) {
      fromInBaseCoords = await this.base.transformClientPositionToLocal(clientX, clientY)
      toInBaseCoords = await this.getDeepestRenderedWayPointPositionInBaseCoords(this.data.toWayPoints, baseRect)
    } else {
      util.logError('Given LinkEnd is not contained by Link.')
    }

    await this.renderAtPosition(fromInBaseCoords, toInBaseCoords)
  }

  public async renderLinkEndInDropTargetAndSave(linkEnd: LinkEnd, dropTarget: Box): Promise<void> {
    if (linkEnd === this.to) {
      await this.reorderAndSave(this.from.getBorderingBox(), dropTarget)
    } else if (linkEnd === this.from) {
      await this.reorderAndSave(dropTarget, this.to.getBorderingBox())
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
    const lineHtml: string = '<line '+linePositionHtml+' style="stroke:blue;stroke-width:2px;"/>'

    if (this.rendered === false) {
      const fromHtml: string = '<div id="'+this.from.getId()+'" draggable="true"></div>'
      const toHtml: string = '<div id="'+this.to.getId()+'" draggable="true"></div>'
      const svgHtml: string = '<svg id="'+this.data.id+'line">'+lineHtml+'</svg>'
      await dom.addContentTo(this.base.getId(), '<div id="'+this.data.id+'">'+svgHtml+fromHtml+toHtml+'</div>')
      await dom.setStyleTo(this.data.id+'line', 'position:absolute;top:0;width:100%;height:100%;pointer-events:none;')
      this.rendered = true
    } else {
      await dom.setContentTo(this.data.id+'line', lineHtml)
    }

    const fromBox: Box = this.getDeepestRenderedBox(this.data.fromWayPoints).box
    await this.from.render(fromBox, fromInBaseCoords.x, fromInBaseCoords.y, angleInRadians)
    const toBox: Box = this.getDeepestRenderedBox(this.data.toWayPoints).box
    await this.to.render(toBox, toInBaseCoords.x, toInBaseCoords.y, angleInRadians) // TODO: gather awaits for more performance
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

  private getDeepestRenderedBox(path: WayPointData[]): {box: Box, wayPoint: WayPointData}|never {
    if (path.length === 0) {
      util.logError(this.base.getSrcPath+' has empty link path.')
    }

    let pivotBox: FolderBox = this.base
    let pivotWayPoint: WayPointData = path[0]

    for (let i = 0; i < path.length; i++) {
      // TODO: handle if deepest box is not rendered but also log warning if path is corrupted
      pivotWayPoint = path[i]
      let box: Box
      if (pivotWayPoint.boxId === this.base.getId()) {
        box = this.base
      } else {
        box = pivotBox.getChild(pivotWayPoint.boxId)
      }

      if (box instanceof FolderBox) {
        pivotBox = box
      } else {
        if (i != path.length-1) {
          util.logWarning(this.base.getSrcPath+' seems to have a corrupted link, '+box.getSrcPath+' is not the deepest WayPoint in path.')
        }
        return {box: box, wayPoint: pivotWayPoint}
      }
    }

    return {box: pivotBox, wayPoint: pivotWayPoint}
  }

  private async reorderAndSave(fromBox: Box, toBox: Box): Promise<void | never> {
    const fromClientPosition: {x: number, y: number} = await this.from.getClientMidPosition()
    const toClientPosition: {x: number, y: number} = await this.to.getClientMidPosition()
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

    if(this.base !== relation.commonAncestor) {
      const oldBase: FolderBox = this.base
      this.base = relation.commonAncestor
      FolderBox.changeManagingBoxOfLinkAndSave(oldBase, relation.commonAncestor, this)
    } else {
      this.base.saveMapData()
    }

    await this.render()
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
