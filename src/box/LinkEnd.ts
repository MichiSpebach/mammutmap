import { util } from '../util'
import { renderManager } from '../RenderManager'
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

export class LinkEnd implements Draggable<Box> {
  private readonly id: string
  private readonly data: LinkEndData
  private readonly referenceLink: Link
  private shape: 'square'|'arrow'
  private rendered: boolean = false
  private borderingBox: Box|null = null
  private static watcherOfManagingBoxToPreventUnrenderWhileDragging: BoxWatcher|null = null

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

  public dragStart(clientX: number, clientY: number): Promise<void> {
    this.watchManagingBox()
    return this.referenceLink.renderLinkEndAtPosition(this, new ClientPosition(clientX, clientY), true)
  }

  public async drag(clientX: number, clientY: number, dropTarget: Box, snapToGrid: boolean): Promise<void> {
    let targetPosition: ClientPosition
    if (snapToGrid) {
      const localDropTargetPosition: LocalPosition = await dropTarget.transform.clientToLocalPosition(new ClientPosition(clientX, clientY))
      const localDropTargetPositionSnappedToGrid: LocalPosition = dropTarget.transform.getNearestGridPositionOf(localDropTargetPosition)
      targetPosition = await dropTarget.transform.localToClientPosition(localDropTargetPositionSnappedToGrid)
    } else {
      targetPosition = new ClientPosition(clientX, clientY)
    }
    return this.referenceLink.renderLinkEndAtPosition(this, targetPosition, true)
  }

  public async dragCancel(): Promise<void> {
    await this.referenceLink.render()
    this.unwatchManagingBox()
  }

  public async dragEnd(dropTarget: Box): Promise<void> {
    await this.referenceLink.renderLinkEndInDropTargetAndSave(this, dropTarget)
    this.unwatchManagingBox()
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

  public async getClientMidPosition(): Promise<{x: number, y: number}> {
    const clientRect: Rect = await renderManager.getClientRectOf(this.getId())
    return {x: clientRect.x + clientRect.width/2, y: clientRect.y + clientRect.height/2}
  }

  public getDeepestRenderedWayPointPositionInManagingBoxCoords(): LocalPosition {
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

}
