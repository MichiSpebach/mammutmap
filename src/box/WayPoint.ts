import * as util from '../util'
import * as dom from '../domAdapter'
import { Draggable } from '../Draggable';
import { DropTarget } from '../DropTarget';
import { DragManager } from '../DragManager'
import { Box } from './Box';
import { WayPointData } from './WayPointData'
import { Link } from './Link';

export class WayPoint implements Draggable<Box> {
  private readonly id: string
  private readonly data: WayPointData
  private readonly referenceLink: Link
  private rendered: boolean = false
  private dropTarget: Box|null = null
  private recentDragPosition: {x: number, y: number}|null = null

  public constructor(id: string, data: WayPointData, referenceLink: Link) {
    this.id = id
    this.data = data
    this.referenceLink = referenceLink
  }

  public getId(): string {
    return this.id
  }

  public getDropTargetAtDragStart(): Box|never {
    if (!this.dropTarget) {
      util.logError('WayPoint must be rendered before calling getDropTargetAtDragStart(), but was not.')
    }
    return this.dropTarget
  }

  canBeDroppedInto(dropTarget: DropTarget): boolean {
    return dropTarget instanceof Box
  }

  public dragStart(clientX: number, clientY: number): Promise<void> {
    this.recentDragPosition = {x: clientX, y: clientY}
    return this.referenceLink.moveWayPointTo(this, clientX, clientY)
  }

  public drag(clientX: number, clientY: number): Promise<void> {
    this.recentDragPosition = {x: clientX, y: clientY}
    return this.referenceLink.moveWayPointTo(this, clientX, clientY)
  }

  public dragCancel(): Promise<void> {
    this.recentDragPosition = null
    return this.referenceLink.render()
  }

  public async dragEnd(dropTarget: Box): Promise<void> {
    if (this.recentDragPosition === null) {
      util.logError('recentDragPosition is null')
    }

    await this.referenceLink.moveWayPointToAndSave(this, this.recentDragPosition.x, this.recentDragPosition.y, dropTarget)

    this.recentDragPosition = null
  }

  public async render(toBox: Box, x: number, y: number, angleInRadians: number): Promise<void> {
    this.dropTarget = toBox

    const positionStyle = 'position:absolute;left:'+x+'%;top:'+y+'%;'
    const triangleStyle = 'width:28px;height:10px;background:blue;clip-path:polygon(0% 0%, 55% 50%, 0% 100%);'
    const transformStyle = 'transform:translate(-14px, -5px)rotate('+angleInRadians+'rad);'

    await dom.setStyleTo(this.getId(), positionStyle + triangleStyle + transformStyle)

    if (!this.rendered) {
      DragManager.addDraggable(this)
      this.rendered = true
    }
  }

}
