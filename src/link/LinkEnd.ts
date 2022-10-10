import { util } from '../util'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import { Draggable } from '../Draggable'
import { DropTarget } from '../DropTarget'
import { DragManager } from '../DragManager'
import { Box } from '../box/Box'
import { Link } from './Link'
import { ClientPosition, LocalPosition } from '../box/Transform'
import { WayPointData } from '../box/WayPointData'
import { LinkEndData } from '../box/LinkEndData'
import { NodeWidget } from '../node/NodeWidget'
import { Shape } from '../shape/Shape'
import { FolderBox } from '../box/FolderBox'
import * as linkUtil from './linkUtil'

export class LinkEnd implements Draggable<Box|NodeWidget> {
  private readonly id: string
  private readonly data: LinkEndData
  private readonly referenceLink: Link
  private shape: 'square'|'arrow'
  private rendered: boolean = false
  private boxesRegisteredAt: (Box|NodeWidget)[] = []
  private renderedTarget: Box|NodeWidget|undefined
  private dragState: {
    clientPosition: ClientPosition
    dropTarget: Box|NodeWidget
    snapToGrid: boolean
  } | null = null

  public constructor(id: string, data: LinkEndData, referenceLink: Link, shape: 'square'|'arrow', renderedTarget?: Box|NodeWidget) {
    this.id = id
    this.data = data
    this.referenceLink = referenceLink
    this.shape = shape
    this.renderedTarget = renderedTarget
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

  public getRenderedTargetBox(): Box {
    const target: Box|NodeWidget = this.getRenderedTarget()
    return target instanceof NodeWidget ? target.getManagingBox() : target
  }

  public getRenderedTarget(): Box|NodeWidget {
    if (!this.renderedTarget) {
      util.logWarning('LinkEnd should be rendered before calling getRenderedTarget() or renderedTarget should be set in constructor, but was not.')
      this.renderedTarget = this.getManagingBox()
    }
    return this.renderedTarget
  }

  public getDropTargetAtDragStart(): Box|NodeWidget|never {
    return this.getRenderedTarget()
  }

  public canBeDroppedInto(dropTarget: DropTarget): boolean {
    return dropTarget instanceof Box || dropTarget instanceof NodeWidget
  }

  // TODO: only workaround, remove asap
  public getDropTargetIfRenderInProgress(): Box|NodeWidget|null {
    return this.dragState && this.dragState.dropTarget
  }

  public async dragStart(clientX: number, clientY: number): Promise<void> {
    this.dragState = {clientPosition: new ClientPosition(clientX, clientY), dropTarget: this.getDropTargetAtDragStart(), snapToGrid: false} // TODO add dropTarget and snapToGrid to dragstart(..)
    return this.referenceLink.renderWithOptions({priority: RenderPriority.RESPONSIVE, draggingInProgress: true})
  }

  public async drag(clientX: number, clientY: number, dropTarget: Box|NodeWidget, snapToGrid: boolean): Promise<void> {
    this.dragState = {clientPosition: new ClientPosition(clientX, clientY), dropTarget: dropTarget, snapToGrid: snapToGrid}
    return this.referenceLink.render(RenderPriority.RESPONSIVE)
  }

  public async dragCancel(): Promise<void> {
    await this.referenceLink.renderWithOptions({priority: RenderPriority.RESPONSIVE, draggingInProgress: false})
    this.dragState = null
  }

  public async dragEnd(dropTarget: Box|NodeWidget): Promise<void> {
    if (!this.dragState) {
      util.logWarning('dragState is null while calling dragEnd(..) on LinkEnd, this should never happen')
    } else {
      this.dragState.dropTarget = dropTarget
    }
    this.renderedTarget = dropTarget
    await this.referenceLink.reorderAndSave({priority: RenderPriority.RESPONSIVE, draggingInProgress: false})
    this.dragState = null
  }

  public async reorderMapDataPathWithoutRender(newManagingBoxForValidation: Box): Promise<void> {
    if (newManagingBoxForValidation !== this.getManagingBox()) {
      let message = 'newManagingBox should already be set to referenceLink when calling reorderMapDataPathWithoutRender(..)'
      message += ', this will likely lead to further problems'
      util.logWarning(message)
    }

    let target: Box|NodeWidget
    let targetWayPoint: WayPointData
    if (this.dragState) {
      target = this.dragState.dropTarget
      if (target instanceof NodeWidget) {
        targetWayPoint = WayPointData.buildNew(target.getId(), 'node'+target.getId(), 50, 50)
      } else {
        const position: LocalPosition = await target.transform.clientToLocalPosition(await this.getTargetPositionInClientCoords())
        targetWayPoint = WayPointData.buildNew(target.getId(), target.getName(), position.percentX, position.percentY)
      }
    } else {
      target = this.getRenderedTarget()
      targetWayPoint = this.getWayPointOf(target)
    }

    const shallowRenderedPath: {box: Box, wayPoint: WayPointData}[] = []
    if (target instanceof NodeWidget) {
      const targetBox: Box = target.getManagingBox()
      shallowRenderedPath.unshift({box: targetBox, wayPoint: targetWayPoint})
      if (targetBox !== this.getManagingBox()) {
        const positionInTargetBoxCoords: LocalPosition = target.getSavePosition()
        const targetBoxWayPoint: WayPointData = WayPointData.buildNew(
          targetBox.getId(),
          targetBox.getName(),
          positionInTargetBoxCoords.percentX,
          positionInTargetBoxCoords.percentY
        )
        shallowRenderedPath.unshift({box: targetBox, wayPoint: targetBoxWayPoint})
      }
    } else {
      shallowRenderedPath.unshift({box: target, wayPoint: targetWayPoint});
    }
    
    for (let previous: {box: Box, wayPoint: WayPointData} = shallowRenderedPath[0]; previous.box !== this.getManagingBox(); previous = shallowRenderedPath[0]) {
      if (previous.box.isRoot()) {
        let message = `did not find managingBox while reorderMapDataPathWithoutRender(..) of LinkEnd with id ${this.getId()}`
        message += ', this could happen when reorderMapDataPathWithoutRender(..) is called before the new managingBox is set'
        util.logWarning(message)
        break
      }
      const nextBox: Box = previous.box.getParent()
      if (nextBox === this.getManagingBox()) {
        break
      }
      const nextPosition: LocalPosition = previous.box.transform.toParentPosition(previous.wayPoint.getPosition())
      const nextWayPoint: WayPointData = WayPointData.buildNew(nextBox.getId(), nextBox.getName(), nextPosition.percentX, nextPosition.percentY)
      shallowRenderedPath.unshift({box: nextBox, wayPoint: nextWayPoint})
    }

    let newPath: WayPointData[]
    if (this.dragState) {
      newPath = shallowRenderedPath.map(tuple => tuple.wayPoint)
    } else {
      newPath = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(this.data.path, shallowRenderedPath.map(tuple => tuple.wayPoint))
    }
    this.data.path = newPath
    this.updateBoxesRegisteredAtAndBorderingBox()
  }

  private getWayPointOf(box: Box|NodeWidget): WayPointData {
    for (const wayPoint of this.data.path) {
      if (wayPoint.boxId === box.getId()) {
        return wayPoint
      }
    }
    util.logWarning('wayPoint not found, this should never happen')
    return WayPointData.buildNew(box.getId(), 'workaround', 50, 50)
  }

  private updateBoxesRegisteredAtAndBorderingBox(): void {
    const newRenderedBoxes: (Box|NodeWidget)[] = this.getRenderedPathWithoutManagingBox()
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
      this.renderedTarget = newRenderedBoxes[newRenderedBoxes.length-1]
    } else {
      this.renderedTarget = this.getManagingBox()
    }
  }

  // TODO: remove parameter positionInManagingBoxCoords
  // TODO: now more frequent called, add renderPriority
  public async render(positionInManagingBoxCoords: LocalPosition, angleInRadians: number): Promise<void> {
    this.updateBoxesRegisteredAtAndBorderingBox() // important because zooming could have happened

    await Promise.all([ // TODO: await at end of method
      this.renderShape(positionInManagingBoxCoords, angleInRadians),
      this.setHighlight()
    ])

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
        shapeStyle = 'width:10px;height:10px;background-color:'+this.referenceLink.getColor()+';'
        transformStyle = 'transform:translate(-5px,-5px);'
        break
      case 'arrow':
        shapeStyle = 'width:28px;height:10px;background-color:'+this.referenceLink.getColor()+';clip-path:polygon(0% 0%, 55% 50%, 0% 100%);'
        transformStyle = 'transform:translate(-14px,-5px)rotate('+angleInRadians+'rad);'
        break
      default:
        shapeStyle = ''
        transformStyle = ''
        util.logWarning('Shape '+this.shape+' is not implemented.')
    }

    await renderManager.setStyleTo(this.getId(), positionStyle + shapeStyle + transformStyle)
  }

  private async setHighlight(): Promise<void> {
    const highlightClass: string = this.referenceLink.getHighlightClass()
    if (this.referenceLink.isHighlight()) {
      await renderManager.addClassTo(this.getId(), highlightClass)
    } else {
      await renderManager.removeClassFrom(this.getId(), highlightClass)
    }
  }

  public async getRenderPositionInManagingBoxCoords(): Promise<LocalPosition> {
    //if (this.data.floatToBorder) { // TODO: activate or rename to renderInsideBox|renderInsideTargetBox
      let clientShape: Promise<Shape<ClientPosition>>
      if (this.dragState) {
        clientShape = this.dragState.dropTarget.getClientShape()
      } else {
        clientShape = this.getDeepestRenderedWayPoint().linkable.getClientShape() // TODO: IMPORTANT this might be a bug when called from outside
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
        return this.dragState.clientPosition // TODO: should snap to center of NodeWidget
      }
    } else {
      return this.getManagingBox().transform.localToClientPosition(this.getDeepestRenderedWayPointPositionInManagingBoxCoords())
    }
  }

  private getDeepestRenderedWayPointPositionInManagingBoxCoords(): LocalPosition {
    const deepestRendered: {linkable: Box|NodeWidget, wayPoint: WayPointData} = this.getDeepestRenderedWayPoint()

    let deepestRenderedBox: Box
    let positionInDeepestRenderedBoxCoords: LocalPosition
    if (deepestRendered.linkable instanceof NodeWidget) {
      deepestRenderedBox = deepestRendered.linkable.getManagingBox()
      positionInDeepestRenderedBoxCoords = deepestRendered.linkable.getRenderPosition()
    } else {
      deepestRenderedBox = deepestRendered.linkable
      positionInDeepestRenderedBoxCoords = deepestRendered.wayPoint.getPosition()
    }

    return this.getManagingBox().transform.innerCoordsRecursiveToLocal(deepestRenderedBox, positionInDeepestRenderedBoxCoords)
  }

  public getDeepestRenderedWayPoint(): {linkable: Box|NodeWidget, wayPoint: WayPointData} {
    const renderedBoxes: {linkable: Box|NodeWidget, wayPoint: WayPointData}[] = this.getRenderedPath()
    return renderedBoxes[renderedBoxes.length-1]
  }

  public getRenderedPathWithoutManagingBox(): (Box|NodeWidget)[] {
    return this.getRenderedPath()
      .map((tuple: {linkable: Box|NodeWidget, wayPoint: WayPointData}) => tuple.linkable)
      .filter(linkable => linkable !== this.getManagingBox())
  }

  private getRenderedPath(): {linkable: Box|NodeWidget, wayPoint: WayPointData}[] {
    if (this.data.path.length === 0) {
      let message = 'Corrupted mapData detected: '
      message += `Link with id ${this.referenceLink.getId()} in ${this.getManagingBox().getSrcPath()} has empty path.`
      util.logWarning(message)
    }

    const renderedPath: {linkable: Box|NodeWidget, wayPoint: WayPointData}[] = []

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
        const node: NodeWidget|undefined = parentBox.nodes.getNodeById(wayPoint.boxId)
        if (node && node.shouldBeRendered()) {
          linkable = node
        }
      }
      if (!linkable) {
        break // box is not rendered
      }

      renderedPath.push({linkable, wayPoint})

      if (linkable instanceof Box) {
        parentBox = linkable
      } else {
        break
      }
    }

    if (renderedPath.length === 0) {
      const managingBox: Box = this.getManagingBox()
      let message = 'Corrupted mapData detected: '
      message += `Link with id ${this.referenceLink.getId()} in ${managingBox.getSrcPath()} has path with no rendered boxes, `
      message += 'this only happens when mapData is corrupted. '
      message += 'Defaulting LinkEnd to center of managingBox.'
      util.logWarning(message)
      renderedPath.push({linkable: managingBox, wayPoint: WayPointData.buildNew(managingBox.getId(), managingBox.getName(), 50, 50)})
    }

    return renderedPath
  }

}
