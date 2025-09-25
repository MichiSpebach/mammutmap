import { util } from '../util/util'
import { renderManager, RenderPriority } from '../renderEngine/renderManager'
import { style } from '../styleAdapter'
import { Draggable } from '../Draggable'
import { DropTarget } from '../DropTarget'
import { relocationDragManager } from '../RelocationDragManager'
import { Box } from '../box/Box'
import { Link } from './Link'
import { ClientPosition } from '../shape/ClientPosition'
import { LocalPosition } from '../shape/LocalPosition'
import { WayPointData } from '../mapData/WayPointData'
import { LinkEndData } from '../mapData/LinkEndData'
import { NodeWidget } from '../node/NodeWidget'
import { Shape } from '../shape/Shape'
import * as linkUtil from './linkUtil'
import { RenderState } from '../util/RenderState'
import { SkipToNewestScheduler } from '../util/SkipToNewestScheduler'
import { log } from '../logService'
import { AbstractNodeWidget } from '../AbstractNodeWidget'
import { BoxWatcher } from '../box/BoxWatcher'

export class LinkEnd implements Draggable<Box|NodeWidget> {
  private readonly id: string
  private readonly data: LinkEndData
  private readonly referenceLink: Link
  private shape: 'square'|'arrow'
  private renderState: RenderState = new RenderState()
  private renderScheduler: SkipToNewestScheduler = new SkipToNewestScheduler()
  private renderedHighlight: {bright: boolean, foregrounded: boolean} = {bright: false, foregrounded: false}
  private dragState: {
    clientPosition: ClientPosition
    dropTarget: Box|NodeWidget
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
  
  public getOtherEnd(): LinkEnd {
    return this.referenceLink.from === this ? this.referenceLink.to : this.referenceLink.from
  }

  public shouldBeRendered(): boolean {
    const firstNodeInPathId: string = this.data.path[0].boxId
    if (this.getManagingBox().getId() === firstNodeInPathId) {
      return true
    }
    const firstNodeInPath: Box|NodeWidget|undefined = this.getManagingBox().findChildById(firstNodeInPathId)
    if (!firstNodeInPath) {
      let message = `LinkEnd::shouldBeRendered() firstNodeInPath with id '${firstNodeInPathId}' and name '${this.data.path[0].boxName}'`
      message += ` is not included in managingBox with name '${this.getManagingBox().getName()}', defaulting to false.`
      log.warning(message)
      return false
    }
    return firstNodeInPath.isBeingRendered()
  }

  /** TODO: rename to isNodeInPath(..) */
  public isBoxInPath(box: AbstractNodeWidget): boolean {
    return this.data.path.some(wayPoint => wayPoint.boxId === box.getId())
  }

  public getDropTargetAtDragStart(): Box|NodeWidget {
    return this.getDeepestRenderedWayPoint().linkable
  }

  public canBeDroppedInto(dropTarget: DropTarget): boolean {
    return dropTarget instanceof Box || dropTarget instanceof NodeWidget
  }

  // TODO: only workaround, remove asap
  public getDropTargetIfRenderInProgress(): Box|NodeWidget|null {
    return this.dragState && this.dragState.dropTarget
  }

  public async startDragWithClickToDropMode(): Promise<void> {
    await relocationDragManager.startDragWithClickToDropMode(this, true)
  }

  public async dragStart(clientX: number, clientY: number, dropTarget: Box|NodeWidget, snapToGrid: boolean): Promise<void> {
    const snappedDropTarget = await this.getSnappedDropTarget(new ClientPosition(clientX, clientY), dropTarget, snapToGrid)
    this.dragState = {clientPosition: snappedDropTarget.position, dropTarget: snappedDropTarget.target}
    await Promise.all([
      this.referenceLink.renderWithOptions({priority: RenderPriority.RESPONSIVE, draggingInProgress: true}),
      snappedDropTarget.target.onDragEnter()
    ])
  }

  public async drag(clientX: number, clientY: number, dropTarget: Box|NodeWidget, snapToGrid: boolean): Promise<void> {
    if (!this.dragState) {
      util.logWarning('dragState is null while calling drag(..) on LinkEnd, this should never happen')
    }
    const snappedDropTarget = await this.getSnappedDropTarget(new ClientPosition(clientX, clientY), dropTarget, snapToGrid)
    const dropTargetBefore: Box|NodeWidget|undefined = this.dragState?.dropTarget
    this.dragState = {clientPosition: snappedDropTarget.position, dropTarget: snappedDropTarget.target}
    const pros: Promise<void>[] = [
      this.referenceLink.render(RenderPriority.RESPONSIVE)
    ]
    if (dropTargetBefore !== snappedDropTarget.target) {
      if (dropTargetBefore) {
        pros.push(dropTargetBefore.onDragLeave())
      }
      pros.push(snappedDropTarget.target.onDragEnter())
    }
    await Promise.all(pros)
  }

  public async dragCancel(): Promise<void> {
    if (!this.dragState) {
      util.logWarning('dragState is null while calling dragCancel(..) on LinkEnd, this should never happen')
    }
    await Promise.all([
      this.referenceLink.renderWithOptions({priority: RenderPriority.RESPONSIVE, draggingInProgress: false}),
      this.dragState?.dropTarget.onDragLeave()
    ])
    this.dragState = null
  }

  public async dragEnd(clientX: number, clientY: number, dropTarget: Box|NodeWidget, snapToGrid: boolean): Promise<void> {
    if (!this.dragState) {
      util.logWarning('dragState is null while calling dragEnd(..) on LinkEnd, this should never happen')
    }
    const snappedDropTarget = await this.getSnappedDropTarget(new ClientPosition(clientX, clientY), dropTarget, snapToGrid)
    const dropTargetBefore: Box|NodeWidget|undefined = this.dragState?.dropTarget
    this.dragState = {clientPosition: snappedDropTarget.position, dropTarget: snappedDropTarget.target} // used transitively in referenceLink.reorderAndSaveAndRender(..) below
    await Promise.all([
      this.referenceLink.reorderAndSaveAndRender({movedWayPoint: snappedDropTarget.target, movedLinkEnd: this, priority: RenderPriority.RESPONSIVE, draggingInProgress: false}),
      dropTargetBefore?.onDragLeave()
    ])
    this.dragState = null
  }

  /** TODO: offer dragAndDrop(..) in LocalPositions because ClientPositions may not work well when zoomed far away */
  public async dragAndDrop(options: {dropTarget: Box|NodeWidget, clientPosition: ClientPosition, snapToGrid?: boolean}): Promise<void> {
    this.dragState = {snapToGrid: !!options.snapToGrid, ...options}
    return this.dragEnd(options.clientPosition.x, options.clientPosition.y, options.dropTarget, !!options.snapToGrid)
  }

  private async getSnappedDropTarget(clientPosition: ClientPosition, dropTarget: Box|NodeWidget, snapToGrid: boolean): Promise<{target: Box|NodeWidget, position: ClientPosition}> {
    if (!snapToGrid || !(dropTarget instanceof Box)) {
      return {target: dropTarget, position: clientPosition} // TODO: if NodeWidget: should snap to center of NodeWidget?
    }
    const snapTarget = await dropTarget.raster.getSnapTargetAt(clientPosition)
    return {target: snapTarget.snapTarget, position: snapTarget.snapPosition}
  }

  public async reorderMapDataPathWithoutRender(options: {
    newManagingBoxForValidation: Box
    movedWayPoint: Box|NodeWidget
  }): Promise<void> {
    if (options.newManagingBoxForValidation !== this.getManagingBox()) {
      let message = 'newManagingBox should already be set to referenceLink when calling reorderMapDataPathWithoutRender(..)'
      message += ', this will likely lead to further problems'
      util.logWarning(message)
    }

    const target: Box|NodeWidget = options.movedWayPoint
    let targetWayPoint: WayPointData
    if (this.dragState) {
      if (target instanceof NodeWidget) {
        targetWayPoint = WayPointData.buildNew(target.getId(), 'node'+target.getId(), 50, 50)
      } else {
        const position: LocalPosition = await target.transform.clientToLocalPosition(await this.getTargetPositionInClientCoords())
        targetWayPoint = WayPointData.buildNew(target.getId(), target.getName(), position.percentX, position.percentY)
      }
    } else {
      targetWayPoint = this.getWayPointOf(target)
    }

    const shallowRenderedPath: {box: Box, wayPoint: WayPointData}[] = []
    if (target instanceof NodeWidget) {
      const targetBox: Box = target.getParent()
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
    await this.saveBorderingBoxesWithoutMapFile()
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

  private async saveBorderingBoxesWithoutMapFile(): Promise<void> {
    const borderingBoxesWithoutMapFile: (Box|NodeWidget)[] = this.getRenderedPathWithoutManagingBox().filter(box => !box.isMapDataFileExisting())
    await Promise.all(borderingBoxesWithoutMapFile.map(box => box.saveMapData()))
  }

  // TODO: remove parameter positionInManagingBoxCoords
  public async render(positionInManagingBoxCoords: LocalPosition, angleInRadians: number, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> { await this.renderScheduler.schedule(async () => {
    this.renderState.setRenderStarted()
    const pros: Promise<void>[] = []

    pros.push(this.renderShape(positionInManagingBoxCoords, angleInRadians, priority))
    pros.push(this.updateHighlight(priority))
  
    if (!this.renderState.isRendered()) {
      this.saveBorderingBoxesWithoutMapFile() // TODO: add missing await? but could take longer and block rerenders
      pros.push(relocationDragManager.addDraggable(this, true, priority))
    }

    await Promise.all(pros)
    this.renderState.setRenderFinished()
  })}

  public async unrender(): Promise<void> { await this.renderScheduler.schedule(async () => {
    if (!this.renderState.isRendered()) {
      return
    }
    this.renderState.setUnrenderStarted()

    await Promise.all([
      relocationDragManager.removeDraggable(this),
      renderManager.setStyleTo(this.getId(), '')
    ])

    this.renderState.setUnrenderFinished()
  })}

  private async renderShape(positionInManagingBoxCoords: LocalPosition, angleInRadians: number, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
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

    await renderManager.setStyleTo(this.getId(), positionStyle + shapeStyle + transformStyle, priority)
  }

  private async updateHighlight(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    const pros: Promise<void>[] = []
    
    if (this.referenceLink.getHighlights().isBright()) {
      if (!this.renderedHighlight.bright) {
        this.renderedHighlight.bright = true
        pros.push(renderManager.addClassTo(this.getId(), style.getHighlightLinkBrightClass(), priority))
      }
    } else {
      if (this.renderedHighlight.bright) {
        this.renderedHighlight.bright = false
        pros.push(renderManager.removeClassFrom(this.getId(), style.getHighlightLinkBrightClass(), priority))
      }
    }
    
    if (this.referenceLink.getHighlights().isForegrounded()) {
      if (!this.renderedHighlight.foregrounded) {
        this.renderedHighlight.foregrounded = true
        pros.push(renderManager.addClassTo(this.getId(), style.getHighlightLinkForegroundClass(), priority))
      }
    } else {
      if (this.renderedHighlight.foregrounded) {
        this.renderedHighlight.foregrounded = false
        pros.push(renderManager.removeClassFrom(this.getId(), style.getHighlightLinkForegroundClass(), priority))
      }
    }

    await Promise.all(pros)
  }

  public async getRenderPositionInManagingBoxCoords(): Promise<LocalPosition> {
    //if (this.data.floatToBorder) { // TODO: activate or rename to renderInsideBox|renderInsideTargetBox
      const floatToBorderPosition: ClientPosition|undefined = await this.calculateFloatToBorderClientPosition()
      if (floatToBorderPosition) {
        return this.getManagingBox().transform.clientToLocalPosition(floatToBorderPosition)
      }
    //}
    return this.getTargetPositionInManagingBoxCoords()
  }
  
  public async getRenderPositionInClientCoords(): Promise<ClientPosition> {
    //if (this.data.floatToBorder) { // TODO: activate or rename to renderInsideBox|renderInsideTargetBox
      const floatToBorderPosition: ClientPosition|undefined = await this.calculateFloatToBorderClientPosition()
      if (floatToBorderPosition) {
        return floatToBorderPosition
      }
    //}
    return this.getTargetPositionInClientCoords()
  }

  private async calculateFloatToBorderClientPosition(): Promise<ClientPosition|undefined> {
    let clientShape: Promise<Shape<ClientPosition>>
    if (this.dragState) {
      clientShape = this.dragState.dropTarget.getClientShape()
    } else {
      clientShape = this.getDeepestRenderedWayPoint().linkable.getClientShape() // TODO: IMPORTANT this might be a bug when called from outside
    }
    const intersectionWithRect: ClientPosition|undefined = await this.calculateFloatToBorderPositionRegardingClientShape(clientShape)
    /*if (!intersectionWithRect) { // TODO: figure out why this happens
      log.warning(`LinkEnd::getRenderPositionInClientCoords() no intersection with rect ${JSON.stringify(await clientShape)} in ${this.referenceLink.describe()}.`)
    }*/
    return intersectionWithRect
  }

  private async calculateFloatToBorderPositionRegardingClientShape(shapeInClientCoords: Promise<Shape<ClientPosition>>): Promise<ClientPosition|undefined> {
    const line: {from: ClientPosition, to: ClientPosition} = await this.referenceLink.getLineInClientCoords()
    const intersectionsWithShape: ClientPosition[] = (await shapeInClientCoords).calculateIntersectionsWithLine(line)
    let targetPositionOfOtherLinkEnd: ClientPosition
    if (this === this.referenceLink.from) {
      targetPositionOfOtherLinkEnd = line.to
    } else {
      targetPositionOfOtherLinkEnd = line.from
    }

    let nearestIntersection: {position: ClientPosition, distance: number}|undefined = undefined
    for (let i = 0; i < intersectionsWithShape.length; i++) {
      const distance: number = targetPositionOfOtherLinkEnd.calculateDistanceTo(intersectionsWithShape[i])
      if (!nearestIntersection || distance < nearestIntersection.distance) {
        nearestIntersection = {position: intersectionsWithShape[i], distance}
      }
    }

    if (!nearestIntersection || nearestIntersection.distance === 0) { // distance 0 means link would have length 0, happens if target is managingBox or would be managingBox while dragging
      return undefined
    }
    return nearestIntersection.position
  }

  public async getTargetPositionInManagingBoxCoords(): Promise<LocalPosition> {
    if (this.dragState) {
      return this.getManagingBox().transform.clientToLocalPosition(this.dragState.clientPosition)
    } else {
      return this.getDeepestRenderedWayPointPositionInManagingBoxCoords()
    }
  }

  public async getTargetPositionInClientCoords(): Promise<ClientPosition> {
    if (this.dragState) {
      return this.dragState.clientPosition
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

  // TODO: rewrite, fragility comes from breaking the encapsulation of Box. simply call this.getManagingBox().getRenderedBoxesInPath(path: Path): Box[] and merge it with wayPointData
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
      } else {
        linkable = parentBox.findChildById(wayPoint.boxId)
      }

      if (!linkable || !linkable.isBeingRendered()) {
        break
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
      let message = `LinkEnd::getRenderedPath() LinkEnd with id '${this.getId()}' in ${this.referenceLink.describe()} has path with no rendered boxes.`
      if (managingBox.isBodyBeingRendered()) {
        message += ' This only happens when mapData is corrupted or LinkEnd::getRenderedPath() is called when it shouldn\'t.'
      } else {
        message += ' Reason is most likely that the managingBox of the link is (being) unrendered.'
      }
      message += ' Defaulting LinkEnd to center of managingBox.'
      util.logWarning(message)
      renderedPath.push({linkable: managingBox, wayPoint: WayPointData.buildNew(managingBox.getId(), managingBox.getName(), 50, 50)})
    }

    return renderedPath
  }

  public getTargetNodeId(): string {
    const target: WayPointData|undefined = this.data.path.at(-1)
    if (!target) {
      log.warning(`LinkEnd::getTargetNodeId() data.path is empty for LinkEnd with id '${this.getId()}' in ${this.referenceLink.describe()}. This only happens when mapData is corrupted, returning empty string.`)
      return ''
    }
    return target.boxId
  }

  public async getTargetAndRenderIfNecessary(): Promise<{node: AbstractNodeWidget, watcher: BoxWatcher}> {
    const link: Link = this.referenceLink
    const path: WayPointData[] = this.data.path
    if (path.length === 1 && path[0].boxId === link.getManagingBox().getId()) {
      return {node: link.getManagingBox(), watcher: await BoxWatcher.newAndWatch(link.getManagingBox())}
    }
    return link.getManagingBox().getDescendantByPathAndRenderIfNecessary(path.map(wayPoint => ({id: wayPoint.boxId})))
  }

}
