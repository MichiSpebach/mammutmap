import { util } from './util'
import { style } from './styleAdapter'
import { renderManager, RenderPriority } from './RenderManager'
import { BoxBorder } from './box/BoxBorder'
import { Rect } from './Rect'
import { Box } from './box/Box'

export class ScaleManager {

  //private static scalables: Map<string, BoxBorder> = new Map() // TODO: introduce interface Scalable
  private static state: {
    scaling: BoxBorder,
    startParentClientRect: Promise<Rect>,
    startClientRect: Promise<Rect>,
    startClientX: number,
    startClientY: number
  } | null = null
  //private static onScaling: ((clientX: number, clientY: number) => void) | null
  //private static initialized: boolean = false

  /*public static init(listenerElementId: string): void {
    dom.addDragListenerTo('map', 'mousedown', async (clientX: number, clientY:number, targetId: string): Promise<void> => {
      const classes: string[] = await dom.getClassesOf(targetId)
      util.logInfo(classes.toString())
      if (classes.includes(this.horizontalStyleClass)) {
        util.logInfo('horizontal resize')
      } else if (classes.includes(this.verticalStyleClass)) {
        util.logInfo('vertical resize')
      } else {
        return
      }

      const scaling : BoxBorder|undefined = this.scalables.get(targetId)
      if (scaling == null) {
        util.logWarning('scalables is expected to contain "' + targetId + '" but does not')
        return
      }
      this.scaling = scaling
    })

    dom.addDragListenerTo('map', 'mousemove', (clientX: number, clientY:number, targetId: string): void => {
      //util.logInfo('resize continue, targetId: ' + targetId)

    })

    dom.addDragListenerTo('map', 'mouseup', (clientX: number, clientY:number, targetId: string): void => {
      util.logInfo('resize end, targetId: ' + targetId)
    })
  }*/

  public static isScalingInProgress(): boolean {
    return this.state !== null
  }

  public static clear(): void {
    this.state = null
    util.setHint(util.hintToDeactivateSnapToGrid, false)
  }

  public static addScalable(scalable: BoxBorder) {

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

    //this.scalables.set(scalable.getRightBottomId(), scalable)
    //this.scalables.set(scalable.getTopId(), scalable)
    //this.scalables.set(scalable.getBottomId(), scalable)
    //this.scalables.set(scalable.getRightId(), scalable)
    //this.scalables.set(scalable.getLeftId(), scalable)
  }

  public static removeScalable(scalable: BoxBorder) {
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

  private static addListenersForSide(scalable: BoxBorder, id: string, drag: (clientX: number, clientY:number, snapToGrid: boolean) => void): void {
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

  private static async dragstart(scalable: BoxBorder, clientX: number, clientY: number): Promise<void> {
    let parentClientRect: Promise<Rect> = scalable.referenceBox.getParent().getClientRect(RenderPriority.RESPONSIVE)
    let clientRect: Promise<Rect> = scalable.referenceBox.getClientRect(RenderPriority.RESPONSIVE)
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

    const startClientRect: Rect = await this.state.startClientRect
    const startParentClientRect: Rect = await this.state.startParentClientRect
    const referenceBox: Box = this.state.scaling.referenceBox

    const newWidthInPixel: number = startClientRect.width + clientX - this.state.startClientX
    let newWidthInPercent: number = newWidthInPixel / startParentClientRect.width * 100
    if (snapToGrid) {
      const leftBorderPositionInPercent: number = (startClientRect.x-startParentClientRect.x) / startParentClientRect.width * 100
      const newRightBorderPositionInPercent: number = referenceBox.getParent().transform.roundToGridPosition(leftBorderPositionInPercent+newWidthInPercent)
      newWidthInPercent = newRightBorderPositionInPercent-leftBorderPositionInPercent
    }

    referenceBox.updateMeasuresAndBorderingLinks({width: newWidthInPercent}, RenderPriority.RESPONSIVE)
  }

  private static async dragSouthBorder(clientX: number, clientY: number, snapToGrid: boolean): Promise<void> {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const startClientRect: Rect = await this.state.startClientRect
    const startParentClientRect: Rect = await this.state.startParentClientRect
    const referenceBox: Box = this.state.scaling.referenceBox

    const newHeightInPixel: number = startClientRect.height + clientY - this.state.startClientY
    let newHeightInPercent: number = newHeightInPixel / startParentClientRect.height * 100
    if (snapToGrid) {
      const topBorderPositionInPercent: number = (startClientRect.y-startParentClientRect.y) / startParentClientRect.height * 100
      const newBottomBorderPositionInPercent: number = referenceBox.getParent().transform.roundToGridPosition(topBorderPositionInPercent+newHeightInPercent)
      newHeightInPercent = newBottomBorderPositionInPercent-topBorderPositionInPercent
    }

    referenceBox.updateMeasuresAndBorderingLinks({height: newHeightInPercent}, RenderPriority.RESPONSIVE)
  }

  private static async dragNorthBorder(clientX: number, clientY: number, snapToGrid: boolean): Promise<void> {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const startClientRect: Rect = await this.state.startClientRect
    const startParentClientRect: Rect = await this.state.startParentClientRect
    const referenceBox: Box = this.state.scaling.referenceBox

    const dragDistanceInPixel: number = clientY - this.state.startClientY
    const newYInPixel: number = startClientRect.y - startParentClientRect.y + dragDistanceInPixel
    const newHeightInPixel: number = startClientRect.height - dragDistanceInPixel

    let newYInPercent: number = newYInPixel / startParentClientRect.height * 100
    let newHeightInPercent: number = newHeightInPixel / startParentClientRect.height * 100
    if (snapToGrid) {
      const snapToGridDelta: number = referenceBox.getParent().transform.roundToGridPosition(newYInPercent)-newYInPercent
      newYInPercent += snapToGridDelta
      newHeightInPercent -= snapToGridDelta
    }

    referenceBox.updateMeasuresAndBorderingLinks({y: newYInPercent, height: newHeightInPercent}, RenderPriority.RESPONSIVE)
  }

  private static async dragWestBorder(clientX: number, clientY: number, snapToGrid: boolean): Promise<void> {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const startClientRect: Rect = await this.state.startClientRect
    const startParentClientRect: Rect = await this.state.startParentClientRect
    const referenceBox: Box = this.state.scaling.referenceBox

    const dragDistanceInPixel: number = clientX - this.state.startClientX
    const newXInPixel: number = startClientRect.x - startParentClientRect.x + dragDistanceInPixel
    const newWidthInPixel: number = startClientRect.width - dragDistanceInPixel

    let newXInPercent: number = newXInPixel / startParentClientRect.width * 100
    let newWidthInPercent: number = newWidthInPixel / startParentClientRect.width * 100
    if (snapToGrid) {
      const snapToGridDelta: number = referenceBox.getParent().transform.roundToGridPosition(newXInPercent)-newXInPercent
      newXInPercent += snapToGridDelta
      newWidthInPercent -= snapToGridDelta
    }

    referenceBox.updateMeasuresAndBorderingLinks({x: newXInPercent, width: newWidthInPercent}, RenderPriority.RESPONSIVE)
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
