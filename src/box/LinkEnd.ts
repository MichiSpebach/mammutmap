import { util } from '../util'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import { Rect } from '../Rect'
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
import { FolderBox } from './FolderBox'

export class LinkEnd implements Draggable<Box> {
  private readonly id: string
  private readonly data: LinkEndData
  private readonly referenceLink: Link
  private shape: 'square'|'arrow'
  private rendered: boolean = false
  private borderingBox: Box|null = null
  private dragState: {
    clientPosition: ClientPosition
    dropTarget: Box
    snapToGrid: boolean
    watchersOfInvolvedBoxes: { // TODO: move to DragManager and add methods watchInvolvedBoxes & unwatchInvolvedBoxes to Draggable?
      managingBox: Promise<BoxWatcher>
      fromBox: Promise<BoxWatcher>
      toBox: Promise<BoxWatcher>
    }
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
    if (this.dragState) {
      util.logInfo('Can not start dragging of LinkEnd because LinkEnd is still locked from previous dragging operation, try again.') // TODO improve that this is never a problem
      return
    }

    const clientPosition = new ClientPosition(clientX, clientY)
    const watchersOfInvolvedBoxes = this.watchInvolvedBoxes()
    this.dragState = {clientPosition, dropTarget: this.getDropTargetAtDragStart(), snapToGrid: false, watchersOfInvolvedBoxes} // TODO add dropTarget and snapToGrid to dragstart(..)
    return this.referenceLink.render(RenderPriority.RESPONSIVE, true)
  }

  public async drag(clientX: number, clientY: number, dropTarget: Box, snapToGrid: boolean): Promise<void> {
    if (!this.dragState) {
      util.logWarning('can not continue dragging of LinkEnd because dragState is null, this should never happen')
      return
    }

    const clientPosition = new ClientPosition(clientX, clientY)
    const watchersOfInvolvedBoxes = this.dragState.watchersOfInvolvedBoxes
    this.dragState = {clientPosition, dropTarget, snapToGrid, watchersOfInvolvedBoxes}
    return this.referenceLink.render(RenderPriority.RESPONSIVE, true)
  }

  public async dragCancel(): Promise<void> {
    await this.referenceLink.render()
    
    if (!this.dragState) {
      util.logWarning('can not cleanly cancel dragging of LinkEnd because dragState is null, this should never happen')
      return
    }

    this.unwatchInvolvedBoxes(this.dragState.watchersOfInvolvedBoxes)
    this.dragState = null
  }

  public async dragEnd(dropTarget: Box): Promise<void> {
    if (!this.dragState) {
      util.logWarning('can not cleanly finish dragging of LinkEnd because dragState is null, this should never happen')
      await this.referenceLink.renderLinkEndInDropTargetAndSave(this, dropTarget)
      return
    }

    await this.dragState.watchersOfInvolvedBoxes.managingBox
    await this.dragState.watchersOfInvolvedBoxes.fromBox
    await this.dragState.watchersOfInvolvedBoxes.toBox

    await this.referenceLink.renderLinkEndInDropTargetAndSave(this, dropTarget)

    this.unwatchInvolvedBoxes(this.dragState.watchersOfInvolvedBoxes)
    this.dragState = null
  }

  private watchInvolvedBoxes(): {
    managingBox: Promise<BoxWatcher>
    fromBox: Promise<BoxWatcher>
    toBox: Promise<BoxWatcher>
  } {
    return {
      managingBox: BoxWatcher.newAndWatch(this.referenceLink.getManagingBox()),
      fromBox: this.referenceLink.from.getDeepestBoxAndRenderIfNecessary(),
      toBox:this.referenceLink.to.getDeepestBoxAndRenderIfNecessary()
    }
  }

  private async unwatchInvolvedBoxes(involvedBoxes: {
    managingBox: Promise<BoxWatcher>
    fromBox: Promise<BoxWatcher>
    toBox: Promise<BoxWatcher>
  }): Promise<void> {
    const managingBox: BoxWatcher = await involvedBoxes.managingBox
    const fromBox: BoxWatcher = await involvedBoxes.fromBox
    const toBox: BoxWatcher = await involvedBoxes.toBox

    const pros: Promise<any>[] = []

    pros.push(managingBox.unwatch())
    pros.push(fromBox.unwatch())
    pros.push(toBox.unwatch())

    await Promise.all(pros)
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
      let clientRect: Promise<Rect>
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

  private async calculateFloatToBorderPositionRegardingClientRect(rectInClientCoords: Promise<Rect>): Promise<ClientPosition|undefined> {
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
    return this.getManagingBox().transformInnerCoordsRecursiveToLocal(deepestRendered.box, deepestRendered.wayPoint.getPosition())
  }

  public getDeepestRenderedBox(): {box: Box, wayPoint: WayPointData} | never {
    const renderedBoxes: {box: Box, wayPoint: WayPointData}[] = this.getRenderedBoxes()
    return renderedBoxes[renderedBoxes.length-1]
  }

  public getRenderedBoxesWithoutManagingBox(): Box[] {
    return this.getRenderedBoxes().map((tuple: {box: Box, wayPoint: WayPointData}) => tuple.box).filter(box => box !== this.getManagingBox())
  }

  private getRenderedBoxes(): {box: Box, wayPoint: WayPointData}[] | never {
    if (this.data.path.length === 0) {
      util.logError(this.getManagingBox().getSrcPath()+' has empty link path.')
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

  public getDeepestBoxAndRenderIfNecessary(): Promise<BoxWatcher> {
    if (!this.getManagingBox().isFolder()) {
      // TODO WIP
      util.logWarning('TODO WIP')
    }
    return (this.getManagingBox() as FolderBox).getBoxByIdPathAndRenderIfNecessary(this.data.path.map(wayPoint => wayPoint.boxId))
  }

}
