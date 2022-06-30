import { util } from '../util'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import { Draggable } from '../Draggable'
import { DropTarget } from '../DropTarget'
import { DragManager } from '../DragManager'
import { Box } from './Box'
import { Link } from './Link'
import { ClientPosition, LocalPosition } from './Transform'
import { WayPointData } from './WayPointData'
import { LinkEndData } from './LinkEndData'
import { boxManager } from './BoxManager'
import { NodeWidget } from '../node/NodeWidget'
import { Shape } from '../shape/Shape'
import { FolderBox } from './FolderBox'
import * as linkUtil from './linkUtil'

export class LinkEnd implements Draggable<Box|NodeWidget> {
  private readonly id: string
  private readonly data: LinkEndData
  private readonly referenceLink: Link
  private shape: 'square'|'arrow'
  private rendered: boolean = false
  private boxesRegisteredAt: (Box|NodeWidget)[] = []
  private borderingBox: Box|NodeWidget|undefined
  private dragState: {
    clientPosition: ClientPosition
    dropTarget: Box|NodeWidget
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

  public getReferenceLink(): Link {
    return this.referenceLink
  }

  public getManagingBox(): Box {
    return this.referenceLink.getManagingBox()
  }

  public getBorderingBox(): Box|NodeWidget|never {
    if (!this.borderingBox) {
      util.logError('WayPoint must be rendered before calling getBorderingBox(), but was not.')
    }
    return this.borderingBox
  }

  public getDropTargetAtDragStart(): Box|NodeWidget|never {
    return this.getBorderingBox()
  }

  public canBeDroppedInto(dropTarget: DropTarget): boolean {
    return dropTarget instanceof Box || dropTarget instanceof NodeWidget
  }

  public async dragStart(clientX: number, clientY: number): Promise<void> {
    this.dragState = {clientPosition: new ClientPosition(clientX, clientY), dropTarget: this.getDropTargetAtDragStart(), snapToGrid: false} // TODO add dropTarget and snapToGrid to dragstart(..)
    return this.referenceLink.render(RenderPriority.RESPONSIVE, true)
  }

  public async drag(clientX: number, clientY: number, dropTarget: Box|NodeWidget, snapToGrid: boolean): Promise<void> {
    this.dragState = {clientPosition: new ClientPosition(clientX, clientY), dropTarget: dropTarget, snapToGrid: snapToGrid}
    return this.referenceLink.render(RenderPriority.RESPONSIVE, true)
  }

  public async dragCancel(): Promise<void> {
    await this.referenceLink.render()
    this.dragState = null
  }

  public async dragEnd(dropTarget: Box|NodeWidget): Promise<void> {
    //this.dragState.dropTarget = dropTarget
    await this.referenceLink.renderLinkEndInDropTargetAndSave(this, dropTarget)
    this.dragState = null
  }

  // TODO: rename to ..WithoutRender
  public updatePathForUnchangedEnd(newManagingBoxForValidation: Box): void {
    if (newManagingBoxForValidation !== this.getManagingBox()) {
      let message = 'newManagingBox should already be set to referenceLink when calling updatePathForUnchangedEnd(..)'
      message += ', this will likely lead to further problems'
      util.logWarning(message)
    }

    const deepestRenderedBox: Box|NodeWidget = this.getBorderingBox()
    const deepestRenderedWayPoint: WayPointData = this.getWayPointOf(deepestRenderedBox)

    const shallowRenderedPath: {box: Box, wayPoint: WayPointData}[] = []
    if (deepestRenderedBox instanceof NodeWidget) {
      shallowRenderedPath.unshift({box: deepestRenderedBox.getManagingBox(), wayPoint: deepestRenderedWayPoint})
    } else {
      shallowRenderedPath.unshift({box: deepestRenderedBox, wayPoint: deepestRenderedWayPoint});
    }

    for (let previous: {box: Box, wayPoint: WayPointData} = shallowRenderedPath[0]; previous.box !== this.getManagingBox(); previous = shallowRenderedPath[0]) {
      if (previous.box.isRoot()) {
        let message = `did not find managingBox while updatePath() of LinkEnd with id ${this.getId()}`
        message += ', this could happen when LinkEnd::updatePath() is called before the new managingBox is set'
        util.logWarning(message)
        break
      }
      const nextBox: Box = previous.box.getParent()
      if (nextBox === this.getManagingBox()) {
        break
      }
      const nextPosition: LocalPosition = previous.box.transform.toParentPosition(previous.wayPoint.getPosition())
      const nextWayPoint: WayPointData = new WayPointData(nextBox.getId(), nextBox.getName(), nextPosition.percentX, nextPosition.percentY)
      shallowRenderedPath.unshift({box: nextBox, wayPoint: nextWayPoint})
    }

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(this.data.path, shallowRenderedPath.map(value => value.wayPoint))
    this.updateMapDataPath(newPath)
  }

  private getWayPointOf(box: Box|NodeWidget): WayPointData {
    for (const wayPoint of this.data.path) {
      if (wayPoint.boxId === box.getId()) {
        return wayPoint
      }
    }
    util.logWarning('wayPoint not found, this should never happen')
    return new WayPointData(box.getId(), 'workaround', 50, 50)
  }

  // TODO: rename to ..WithoutRender?
  public updateMapDataPath(newPath: WayPointData[]): void { // TODO: make this private
    this.data.path = newPath

    const newRenderedBoxes: (Box|NodeWidget)[] = this.getRenderedBoxesWithoutManagingBox()
    for (const box of newRenderedBoxes) {
      if (!this.boxesRegisteredAt.includes(box)) {
        box.borderingLinks.register(this.referenceLink)
      }
    }
    for (const box of this.boxesRegisteredAt) {
      if (!newRenderedBoxes.includes(box)) {
        box.borderingLinks.deregister(this.referenceLink)
      }
    }

    this.boxesRegisteredAt = newRenderedBoxes

    if (newRenderedBoxes.length > 0) {
      this.borderingBox = newRenderedBoxes[newRenderedBoxes.length-1]
    } else {
      this.borderingBox = this.getManagingBox()
    }
  }

  public async render(borderingBox: Box|NodeWidget, positionInManagingBoxCoords: LocalPosition, angleInRadians: number): Promise<void> {
    this.updateMapDataPath(this.data.path) // update is important because zooming could have happened

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

    this.boxesRegisteredAt.forEach(box => box.borderingLinks.deregister(this.referenceLink))
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
    //if (this.data.floatToBorder) { // TODO: activate or rename to renderInsideBox|renderInsideTargetBox
      let clientShape: Promise<Shape<ClientPosition>>
      if (this.dragState) {
        clientShape = this.dragState.dropTarget.getClientShape()
      } else {
        clientShape = this.getDeepestRenderedBox().box.getClientShape()
      }
      const intersectionWithRect: ClientPosition|undefined = await this.calculateFloatToBorderPositionRegardingClientShape(clientShape)
      if (intersectionWithRect) {
        return this.getManagingBox().transform.clientToLocalPosition(intersectionWithRect)
      }
    //}
    return this.getTargetPositionInManagingBoxCoords()
  }

  private async calculateFloatToBorderPositionRegardingClientShape(shapeInClientCoords: Promise<Shape<ClientPosition>>): Promise<ClientPosition|undefined> {
    const line: {from: ClientPosition, to: ClientPosition} = await this.referenceLink.getLineInClientCoords()
    const intersectionsWithShape: ClientPosition[] = (await shapeInClientCoords).calculateIntersectionsWithLine(line)

    if (intersectionsWithShape.length < 1) {
      return undefined
    }

    let nearestIntersection: ClientPosition = intersectionsWithShape[0]
    for (let i = 1; i < intersectionsWithShape.length; i++) {
      let targetPositionOfOtherLinkEnd: ClientPosition
      if (this === this.referenceLink.from) {
        targetPositionOfOtherLinkEnd = line.to
      } else {
        targetPositionOfOtherLinkEnd = line.from
      }
      if (targetPositionOfOtherLinkEnd.calculateDistanceTo(intersectionsWithShape[i]) < targetPositionOfOtherLinkEnd.calculateDistanceTo(nearestIntersection)) {
        nearestIntersection = intersectionsWithShape[i]
      }
    }
    return nearestIntersection
  }

  public async getTargetPositionInManagingBoxCoords(): Promise<LocalPosition> {
    if (this.dragState) {
      if (this.dragState.snapToGrid && this.dragState.dropTarget instanceof Box) {
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
      if (this.dragState.snapToGrid && this.dragState.dropTarget instanceof Box) {
        return this.dragState.dropTarget.transform.getNearestGridPositionInClientCoords(this.dragState.clientPosition)
      } else {
        return this.dragState.clientPosition
      }
    } else {
      return this.getManagingBox().transform.localToClientPosition(this.getDeepestRenderedWayPointPositionInManagingBoxCoords())
    }
  }

  private getDeepestRenderedWayPointPositionInManagingBoxCoords(): LocalPosition {
    const deepestRendered: {box: Box|NodeWidget, wayPoint: WayPointData} = this.getDeepestRenderedBox()

    let deepestRenderedReferenceBox: Box
    if (deepestRendered.box instanceof NodeWidget) {
      deepestRenderedReferenceBox = deepestRendered.box.getManagingBox()
    } else {
      deepestRenderedReferenceBox = deepestRendered.box
    }

    return this.getManagingBox().transform.innerCoordsRecursiveToLocal(deepestRenderedReferenceBox, deepestRendered.wayPoint.getPosition())
  }

  public getDeepestRenderedBox(): {box: Box|NodeWidget, wayPoint: WayPointData} {
    const renderedBoxes: {box: Box|NodeWidget, wayPoint: WayPointData}[] = this.getRenderedBoxes()

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

  public getRenderedBoxesWithoutManagingBox(): (Box|NodeWidget)[] {
    return this.getRenderedBoxes().map((tuple: {box: Box|NodeWidget, wayPoint: WayPointData}) => tuple.box).filter(box => box !== this.getManagingBox())
  }

  // TODO: use ASAP
  private getRenderedBoxesNew(): {box: Box|NodeWidget, wayPoint: WayPointData}[] {
    if (this.data.path.length === 0) {
      let message = 'Corrupted mapData detected: '
      message += `Link with id ${this.referenceLink.getId()} in ${this.getManagingBox().getSrcPath()} has empty path.`
      util.logWarning(message)
    }

    const renderedBoxesInPath: {box: Box|NodeWidget, wayPoint: WayPointData}[] = []

    let parentBox: Box = this.getManagingBox()
    for(let i = 0; i < this.data.path.length; i++) {
      const wayPoint: WayPointData = this.data.path[i]

      let linkable: Box|NodeWidget|undefined
      if (parentBox.getId() === wayPoint.boxId) {
        linkable = parentBox
      } else if (parentBox instanceof FolderBox) {
        linkable = parentBox.getBox(wayPoint.boxId)
      }
      if (!linkable) {
        linkable = parentBox.nodes.getNodeById(wayPoint.boxId)
      }
      if (!linkable) {
        break // box is not rendered
      }

      renderedBoxesInPath.push({box: linkable, wayPoint})

      if (linkable instanceof Box) {
        parentBox = linkable
      } else {
        break
      }
    }

    if (renderedBoxesInPath.length === 0) {
      const managingBox: Box = this.getManagingBox()
      let message = 'Corrupted mapData detected: '
      message += `Link with id ${this.referenceLink.getId()} in ${managingBox.getSrcPath()} has path with no rendered boxes, `
      message += 'this only happens when mapData is corrupted. '
      message += 'Defaulting LinkEnd to center of managingBox.'
      util.logWarning(message)
      renderedBoxesInPath.push({box: managingBox, wayPoint: new WayPointData(managingBox.getId(), managingBox.getName(), 50, 50)})
    }

    return renderedBoxesInPath
  }

  private getRenderedBoxes(): {box: Box|NodeWidget, wayPoint: WayPointData}[] {
    if (this.data.path.length === 0) {
      let message = 'Corrupted mapData detected: '
      message += `Link with id ${this.referenceLink.getId()} in ${this.getManagingBox().getSrcPath()} has empty path.`
      util.logWarning(message)
    }

    const renderedBoxesInPath: {box: Box|NodeWidget, wayPoint: WayPointData}[] = []

    for(let i = 0; i < this.data.path.length; i++) {
      const box: Box|undefined = boxManager.getBoxIfExists(this.data.path[i].boxId)
      if (!box) {
        // TODO: not nice, refactor
        let lastBox: Box
        if (renderedBoxesInPath.length > 0) {
          lastBox = renderedBoxesInPath[renderedBoxesInPath.length-1].box as Box
        } else {
          lastBox = this.getManagingBox()
        }
        const nodeWidget: NodeWidget|undefined = lastBox.nodes.getNodeById(this.data.path[i].boxId)
        if (nodeWidget) {
          renderedBoxesInPath.push({box: nodeWidget, wayPoint: this.data.path[i]})
        }
      }
      if (box) { // TODO: also check if box is rendered
        renderedBoxesInPath.push({box: box, wayPoint: this.data.path[i]})
      }
    }

    return renderedBoxesInPath
  }

}
