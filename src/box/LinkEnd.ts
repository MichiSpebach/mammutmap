import { util } from '../util'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import { ClientRect } from '../ClientRect'
import { Draggable } from '../Draggable'
import { DropTarget } from '../DropTarget'
import { DragManager } from '../DragManager'
import { Box } from './Box'
import { Link } from './Link'
import { BoxWatcher } from './BoxWatcher'
import { ClientPosition, LocalPosition } from './Transform'
import { WayPointData } from './WayPointData'
import { LinkEndData } from './LinkEndData'
import { boxManager } from './BoxManager'

export class LinkEnd implements Draggable<Box> {
  private readonly id: string
  private readonly data: LinkEndData
  private readonly referenceLink: Link
  private shape: 'square'|'arrow'
  private rendered: boolean = false
  private borderingBox: Box|null = null
  private static watcherOfManagingBoxToPreventUnrenderWhileDragging: BoxWatcher|null = null // TODO: should be handled by DragManager
  private dragState: {
    clientPosition: ClientPosition
    dropTarget: Box
    snapToGrid: boolean
  } | null = null

  public constructor(id: string, data: LinkEndData, referenceLink: Link, shape: 'square'|'arrow') {
    this.id = id
    this.data = data
    this.referenceLink = referenceLink
    this.shape = shape
  }

  public getId(): string {
    return this.id
  }

  private getManagingBox(): Box {
    return this.referenceLink.getManagingBox()
  }

  public getBorderingBox(): Box|never {
    if (!this.borderingBox) {
      util.logError('WayPoint must be rendered before calling getBorderingBox(), but was not.')
    }
    return this.borderingBox
  }

  public getDropTargetAtDragStart(): Box|never {
    return this.getBorderingBox()
  }

  public canBeDroppedInto(dropTarget: DropTarget): boolean {
    return dropTarget instanceof Box
  }

  public async dragStart(clientX: number, clientY: number): Promise<void> {
    this.watchManagingBox()
    this.dragState = {clientPosition: new ClientPosition(clientX, clientY), dropTarget: this.getDropTargetAtDragStart(), snapToGrid: false} // TODO add dropTarget and snapToGrid to dragstart(..)
    return this.referenceLink.render(RenderPriority.RESPONSIVE, true)
  }

  public async drag(clientX: number, clientY: number, dropTarget: Box, snapToGrid: boolean): Promise<void> {
    this.dragState = {clientPosition: new ClientPosition(clientX, clientY), dropTarget: dropTarget, snapToGrid: snapToGrid}
    return this.referenceLink.render(RenderPriority.RESPONSIVE, true)
  }

  public async dragCancel(): Promise<void> {
    await this.referenceLink.render()
    this.unwatchManagingBox()
    this.dragState = null
  }

  public async dragEnd(dropTarget: Box): Promise<void> {
    await this.referenceLink.renderLinkEndInDropTargetAndSave(this, dropTarget)
    this.unwatchManagingBox()
    this.dragState = null
  }

  private async watchManagingBox(): Promise<void> {
    if (LinkEnd.watcherOfManagingBoxToPreventUnrenderWhileDragging) {
      util.logWarning('watcherOfManagingBoxToPreventUnrenderWhileDragging is set at drag start')
      this.unwatchManagingBox()
    }

    LinkEnd.watcherOfManagingBoxToPreventUnrenderWhileDragging = await BoxWatcher.newAndWatch(this.referenceLink.getManagingBox())
  }

  private unwatchManagingBox(): void {
    if (!LinkEnd.watcherOfManagingBoxToPreventUnrenderWhileDragging) {
      util.logWarning('managing box of link is not watched')
      return
    }

    LinkEnd.watcherOfManagingBoxToPreventUnrenderWhileDragging.unwatch()
    LinkEnd.watcherOfManagingBoxToPreventUnrenderWhileDragging = null
  }

  public async render(borderingBox: Box, positionInManagingBoxCoords: LocalPosition, angleInRadians: number): Promise<void> {
    this.borderingBox = borderingBox

    await this.renderShape(positionInManagingBoxCoords, angleInRadians)

    if (!this.rendered) {
      DragManager.addDraggable(this)
      this.rendered = true
    }
  }

  public async unrender(): Promise<void> {
    if (!this.rendered) {
      return
    }

    DragManager.removeDraggable(this)
    await renderManager.setStyleTo(this.getId(), '')

    this.rendered = false
  }

  private async renderShape(positionInManagingBoxCoords: LocalPosition, angleInRadians: number): Promise<void> {
    const positionStyle = 'position:absolute;left:'+positionInManagingBoxCoords.percentX+'%;top:'+positionInManagingBoxCoords.percentY+'%;'
    let shapeStyle: string
    let transformStyle: string

    switch (this.shape) {
      case 'square':
        shapeStyle = 'width:10px;height:10px;background-color:'+style.getLinkColor()+';'
        transformStyle = 'transform:translate(-5px,-5px);'
        break
      case 'arrow':
        shapeStyle = 'width:28px;height:10px;background-color:'+style.getLinkColor()+';clip-path:polygon(0% 0%, 55% 50%, 0% 100%);'
        transformStyle = 'transform:translate(-14px,-5px)rotate('+angleInRadians+'rad);'
        break
      default:
        shapeStyle = ''
        transformStyle = ''
        util.logWarning('Shape '+this.shape+' is not implemented.')
    }

    await renderManager.setStyleTo(this.getId(), positionStyle + shapeStyle + transformStyle)
  }

  public async setHighlight(highlight: boolean): Promise<void> {
    if (!this.rendered) {
      util.logWarning('setHighlight(..) called although LinkEnd '+this.getId()+' is not rendered yet.')
    }

    if (highlight) {
      await renderManager.addClassTo(this.getId(), style.getHighlightClass())
    } else {
      await renderManager.removeClassFrom(this.getId(), style.getHighlightClass())
    }
  }

  public async getRenderPositionInManagingBoxCoords(): Promise<LocalPosition> {
    //if (this.data.floatToBorder) { // TODO: activate
      let clientRect: Promise<ClientRect>
      if (this.dragState) {
        clientRect = this.dragState.dropTarget.getClientRect()
      } else {
        clientRect = this.getDeepestRenderedBox().box.getClientRect()
      }
      const intersectionWithRect: ClientPosition|undefined = await this.calculateFloatToBorderPositionRegardingClientRect(clientRect)
      if (intersectionWithRect) {
        return this.getManagingBox().transform.clientToLocalPosition(intersectionWithRect)
      }
    //}
    return this.getTargetPositionInManagingBoxCoords()
  }

  private async calculateFloatToBorderPositionRegardingClientRect(rectInClientCoords: Promise<ClientRect>): Promise<ClientPosition|undefined> {
    const line: {from: ClientPosition, to: ClientPosition} = await this.referenceLink.getLineInClientCoords()
    const intersectionsWithRect: ClientPosition[] = (await rectInClientCoords).calculateIntersectionsWithLine(line)

    if (intersectionsWithRect.length < 1) {
      return undefined
    }

    let nearestIntersection: ClientPosition = intersectionsWithRect[0]
    for (let i = 1; i < intersectionsWithRect.length; i++) {
      let targetPositionOfOtherLinkEnd: ClientPosition
      if (this === this.referenceLink.from) {
        targetPositionOfOtherLinkEnd = line.to
      } else {
        targetPositionOfOtherLinkEnd = line.from
      }
      if (targetPositionOfOtherLinkEnd.calculateDistanceTo(intersectionsWithRect[i]) < targetPositionOfOtherLinkEnd.calculateDistanceTo(nearestIntersection)) {
        nearestIntersection = intersectionsWithRect[i]
      }
    }
    return nearestIntersection
  }

  public async getTargetPositionInManagingBoxCoords(): Promise<LocalPosition> {
    if (this.dragState) {
      if (this.dragState.snapToGrid) {
        return this.getManagingBox().transform.getNearestGridPositionOfOtherTransform(this.dragState.clientPosition, this.dragState.dropTarget.transform)
      } else {
        return this.getManagingBox().transform.clientToLocalPosition(this.dragState.clientPosition)
      }
    } else {
      return this.getDeepestRenderedWayPointPositionInManagingBoxCoords()
    }
  }

  public async getTargetPositionInClientCoords(): Promise<ClientPosition> {
    if (this.dragState) {
      if (this.dragState.snapToGrid) {
        return this.dragState.dropTarget.transform.getNearestGridPositionInClientCoords(this.dragState.clientPosition)
      } else {
        return this.dragState.clientPosition
      }
    } else {
      return this.getManagingBox().transform.localToClientPosition(this.getDeepestRenderedWayPointPositionInManagingBoxCoords())
    }
  }

  private getDeepestRenderedWayPointPositionInManagingBoxCoords(): LocalPosition {
    const deepestRendered: {box: Box, wayPoint: WayPointData} = this.getDeepestRenderedBox()
    return this.getManagingBox().transform.innerCoordsRecursiveToLocal(deepestRendered.box, deepestRendered.wayPoint.getPosition())
  }

  public getDeepestRenderedBox(): {box: Box, wayPoint: WayPointData} {
    const renderedBoxes: {box: Box, wayPoint: WayPointData}[] = this.getRenderedBoxes()

    if (renderedBoxes.length === 0) {
      const managingBox: Box = this.getManagingBox()
      let message = 'Corrupted mapData detected: '
      message += `Link with id ${this.referenceLink.getId()} in ${managingBox.getSrcPath()} has path with no rendered boxes, `
      message += 'this only happens when mapData is corrupted. '
      message += 'Defaulting LinkEnd to center of managingBox.'
      util.logWarning(message)
      return {box: managingBox, wayPoint: new WayPointData(managingBox.getId(), managingBox.getName(), 50, 50)}
    }

    return renderedBoxes[renderedBoxes.length-1]
  }

  public getRenderedBoxesWithoutManagingBox(): Box[] {
    return this.getRenderedBoxes().map((tuple: {box: Box, wayPoint: WayPointData}) => tuple.box).filter(box => box !== this.getManagingBox())
  }

  private getRenderedBoxes(): {box: Box, wayPoint: WayPointData}[] {
    if (this.data.path.length === 0) {
      let message = 'Corrupted mapData detected: '
      message += `Link with id ${this.referenceLink.getId()} in ${this.getManagingBox().getSrcPath()} has empty path.`
      util.logWarning(message)
    }

    const renderedBoxesInPath: {box: Box, wayPoint: WayPointData}[] = []

    for(let i = 0; i < this.data.path.length; i++) {
      const box: Box|undefined = boxManager.getBoxIfExists(this.data.path[i].boxId)
      if (box) { // TODO: also check if box is rendered
        renderedBoxesInPath.push({box: box, wayPoint: this.data.path[i]})
      }
    }

    return renderedBoxesInPath
  }

}
