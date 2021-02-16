import * as util from '../util'
import * as dom from '../domAdapter'
import { Draggable } from '../Draggable';
import { DragManager } from '../DragManager'
import { Box } from './Box';
import { WayPointData } from './WayPointData'
import { Link } from './Link';

export class WayPoint implements Draggable<Box> {
  private readonly id: string
  private readonly data: WayPointData
  private readonly referenceLink: Link
  private dropTarget: Box|null = null
  private rendered: boolean = false

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

  public dragStart(clientX: number, clientY: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public drag(clientX: number, clientY: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public dragCancel(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  public dragEnd(dropTarget: Box): Promise<void> {
    throw new Error('Method not implemented.');
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
