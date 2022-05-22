import { util } from './util'
import { style } from './styleAdapter'
import { renderManager } from './RenderManager'
import { ScaleTool } from './box/ScaleTool'
import { ClientRect } from './ClientRect'

export class ScaleManager {
  private static state: {
    scaling: ScaleTool, // TODO: introduce interface Scalable?
    startParentClientRect: Promise<ClientRect>,
    startClientRect: Promise<ClientRect>,
    startClientX: number,
    startClientY: number
  } | null = null

  public static isScalingInProgress(): boolean {
    return this.state !== null
  }

  public static clear(): void {
    this.state = null
    util.setHint(util.hintToDeactivateSnapToGrid, false)
  }

  public static addScalable(scalable: ScaleTool) {
    // TODO: set element draggable="true" or use mousedown instead of drag events
    renderManager.addClassTo(scalable.getRightBottomId(), style.getDiagonalResizeClass())
    renderManager.addClassTo(scalable.getTopId(), style.getVerticalResizeClass())
    renderManager.addClassTo(scalable.getBottomId(), style.getVerticalResizeClass())
    renderManager.addClassTo(scalable.getRightId(), style.getHorizontalResizeClass())
    renderManager.addClassTo(scalable.getLeftId(), style.getHorizontalResizeClass())

    this.addListenersForSide(scalable, scalable.getRightBottomId(), (x: number, y:number, snapToGrid: boolean) => this.dragRightBottom(x, y, snapToGrid))
    this.addListenersForSide(scalable, scalable.getRightId(), (x: number, y:number, snapToGrid: boolean) => this.dragEastBorder(x, y, snapToGrid))
    this.addListenersForSide(scalable, scalable.getBottomId(), (x: number, y:number, snapToGrid: boolean) => this.dragSouthBorder(x, y, snapToGrid))
    this.addListenersForSide(scalable, scalable.getTopId(), (x: number, y:number, snapToGrid: boolean) => this.dragNorthBorder(x, y, snapToGrid))
    this.addListenersForSide(scalable, scalable.getLeftId(), (x: number, y:number, snapToGrid: boolean) => this.dragWestBorder(x, y, snapToGrid))
  }

  public static removeScalable(scalable: ScaleTool) {
    renderManager.removeClassFrom(scalable.getRightBottomId(), style.getDiagonalResizeClass())
    renderManager.removeClassFrom(scalable.getTopId(), style.getVerticalResizeClass())
    renderManager.removeClassFrom(scalable.getBottomId(), style.getVerticalResizeClass())
    renderManager.removeClassFrom(scalable.getRightId(), style.getHorizontalResizeClass())
    renderManager.removeClassFrom(scalable.getLeftId(), style.getHorizontalResizeClass())

    this.removeListenersForSide(scalable.getRightBottomId())
    this.removeListenersForSide(scalable.getRightId())
    this.removeListenersForSide(scalable.getBottomId())
    this.removeListenersForSide(scalable.getTopId())
    this.removeListenersForSide(scalable.getLeftId())
  }

  private static addListenersForSide(scalable: ScaleTool, id: string, drag: (clientX: number, clientY:number, snapToGrid: boolean) => void): void {
    renderManager.addDragListenerTo(id, 'dragstart', (clientX: number, clientY:number): void => {
      this.dragstart(scalable, clientX, clientY)
    })

    renderManager.addDragListenerTo(id, 'drag', (clientX: number, clientY:number, ctrlPressed: boolean): void => {
      drag(clientX, clientY, !ctrlPressed)
      util.setHint(util.hintToDeactivateSnapToGrid, !ctrlPressed)
    })

    renderManager.addDragListenerTo(id, 'dragend', (clientX: number, clientY:number): void => {
      this.dragEnd()
    })
  }

  private static removeListenersForSide(id: string): void {
    renderManager.removeEventListenerFrom(id, 'dragstart')
    renderManager.removeEventListenerFrom(id, 'drag')
    renderManager.removeEventListenerFrom(id, 'dragend')
  }

  private static async dragstart(scalable: ScaleTool, clientX: number, clientY: number): Promise<void> {
    let parentClientRect: Promise<ClientRect> = scalable.getParentClientRect()
    let clientRect: Promise<ClientRect> = scalable.getClientRect()
    scalable.scaleStart()

    this.state = {
      scaling: scalable,
      startParentClientRect: parentClientRect,
      startClientRect: clientRect,
      startClientX: clientX,
      startClientY: clientY
    }
  }

  private static dragRightBottom(clientX: number, clientY: number, snapToGrid: boolean): void {
    // TODO: triggers render two times, implement with one render
    this.dragEastBorder(clientX, clientY, snapToGrid)
    this.dragSouthBorder(clientX, clientY, snapToGrid)
  }

  private static async dragEastBorder(clientX: number, clientY: number, snapToGrid: boolean): Promise<void> {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const startClientRect: ClientRect = await this.state.startClientRect
    const startParentClientRect: ClientRect = await this.state.startParentClientRect

    const newWidthInPixel: number = startClientRect.width + clientX - this.state.startClientX
    let newWidthInPercent: number = newWidthInPixel / startParentClientRect.width * 100
    if (snapToGrid) {
      const leftBorderPositionInPercent: number = (startClientRect.x-startParentClientRect.x) / startParentClientRect.width * 100
      const newRightBorderPositionInPercent: number = this.state.scaling.roundToParentGridPosition(leftBorderPositionInPercent+newWidthInPercent)
      newWidthInPercent = newRightBorderPositionInPercent-leftBorderPositionInPercent
    }

    this.state.scaling.scale({width: newWidthInPercent})
  }

  private static async dragSouthBorder(clientX: number, clientY: number, snapToGrid: boolean): Promise<void> {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const startClientRect: ClientRect = await this.state.startClientRect
    const startParentClientRect: ClientRect = await this.state.startParentClientRect

    const newHeightInPixel: number = startClientRect.height + clientY - this.state.startClientY
    let newHeightInPercent: number = newHeightInPixel / startParentClientRect.height * 100
    if (snapToGrid) {
      const topBorderPositionInPercent: number = (startClientRect.y-startParentClientRect.y) / startParentClientRect.height * 100
      const newBottomBorderPositionInPercent: number = this.state.scaling.roundToParentGridPosition(topBorderPositionInPercent+newHeightInPercent)
      newHeightInPercent = newBottomBorderPositionInPercent-topBorderPositionInPercent
    }

    this.state.scaling.scale({height: newHeightInPercent})
  }

  private static async dragNorthBorder(clientX: number, clientY: number, snapToGrid: boolean): Promise<void> {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const startClientRect: ClientRect = await this.state.startClientRect
    const startParentClientRect: ClientRect = await this.state.startParentClientRect

    const dragDistanceInPixel: number = clientY - this.state.startClientY
    const newYInPixel: number = startClientRect.y - startParentClientRect.y + dragDistanceInPixel
    const newHeightInPixel: number = startClientRect.height - dragDistanceInPixel

    let newYInPercent: number = newYInPixel / startParentClientRect.height * 100
    let newHeightInPercent: number = newHeightInPixel / startParentClientRect.height * 100
    if (snapToGrid) {
      const snapToGridDelta: number = this.state.scaling.roundToParentGridPosition(newYInPercent)-newYInPercent
      newYInPercent += snapToGridDelta
      newHeightInPercent -= snapToGridDelta
    }

    this.state.scaling.scale({y: newYInPercent, height: newHeightInPercent})
  }

  private static async dragWestBorder(clientX: number, clientY: number, snapToGrid: boolean): Promise<void> {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const startClientRect: ClientRect = await this.state.startClientRect
    const startParentClientRect: ClientRect = await this.state.startParentClientRect

    const dragDistanceInPixel: number = clientX - this.state.startClientX
    const newXInPixel: number = startClientRect.x - startParentClientRect.x + dragDistanceInPixel
    const newWidthInPixel: number = startClientRect.width - dragDistanceInPixel

    let newXInPercent: number = newXInPixel / startParentClientRect.width * 100
    let newWidthInPercent: number = newWidthInPixel / startParentClientRect.width * 100
    if (snapToGrid) {
      const snapToGridDelta: number = this.state.scaling.roundToParentGridPosition(newXInPercent)-newXInPercent
      newXInPercent += snapToGridDelta
      newWidthInPercent -= snapToGridDelta
    }

    this.state.scaling.scale({x: newXInPercent, width: newWidthInPercent})
  }

  private static dragEnd(): void {
    if (this.state == null) {
      util.logWarning("ScaleManager: failed to save resize operation, state is null although resizing was in progress")
      return
    }
    this.state.scaling.scaleEnd()
    this.state = null
    util.setHint(util.hintToDeactivateSnapToGrid, false)
  }

}
