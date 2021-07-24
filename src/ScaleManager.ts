import * as util from './util'
import { dom } from './domAdapter'
import { RenderPriority } from './RenderManager'
import { BoxBorder } from './box/BoxBorder'
import { Rect } from './Rect'

export class ScaleManager {

  private static readonly verticalStyleClass: string = 'nsResize'
  private static readonly horizontalStyleClass: string = 'ewResize'

  //private static scalables: Map<string, BoxBorder> = new Map() // TODO: introduce interface Scalable
  private static state: {
    scaling: BoxBorder,
    startParentClientRect:Rect,
    startClientRect: Rect,
    startClientX: number,
    startClientY: number
  } | null
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

  public static addScalable(scalable: BoxBorder) {

    // TODO: set element draggable="true" or use mousedown instead of drag events

    dom.addClassTo(scalable.getTopId(), this.verticalStyleClass)
    dom.addClassTo(scalable.getBottomId(), this.verticalStyleClass)
    dom.addClassTo(scalable.getRightId(), this.horizontalStyleClass)
    dom.addClassTo(scalable.getLeftId(), this.horizontalStyleClass)

    this.addListenersForSide(scalable, scalable.getRightId(), (x: number, y:number) => this.dragEastBorder(x, y))
    this.addListenersForSide(scalable, scalable.getBottomId(), (x: number, y:number) => this.dragSouthBorder(x, y))
    this.addListenersForSide(scalable, scalable.getTopId(), (x: number, y:number) => this.dragNorthBorder(x, y))
    this.addListenersForSide(scalable, scalable.getLeftId(), (x: number, y:number) => this.dragWestBorder(x, y))

    //this.scalables.set(scalable.getTopId(), scalable)
    //this.scalables.set(scalable.getBottomId(), scalable)
    //this.scalables.set(scalable.getRightId(), scalable)
    //this.scalables.set(scalable.getLeftId(), scalable)
  }

  private static addListenersForSide(scalable: BoxBorder, id: string, drag: (clientX: number, clientY:number) => void): void {
    dom.addDragListenerTo(id, 'dragstart', (clientX: number, clientY:number): void => {
      this.dragstart(scalable, clientX, clientY)
    })

    dom.addDragListenerTo(id, 'drag', (clientX: number, clientY:number): void => {
      drag(clientX, clientY)
    })

    dom.addDragListenerTo(id, 'dragend', (clientX: number, clientY:number): void => {
      this.dragEnd()
    })
  }

  private static async dragstart(scalable: BoxBorder, clientX: number, clientY: number): Promise<void> {
    let parentClientRect: Promise<Rect> = scalable.referenceBox.getParent().getClientRect()
    let clientRect: Promise<Rect> = scalable.referenceBox.getClientRect()

    this.state = {
      scaling: scalable,
      startParentClientRect: await parentClientRect,
      startClientRect: await clientRect,
      startClientX: clientX,
      startClientY: clientY
    }
  }

  private static dragEastBorder(clientX: number, clientY: number): void {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const newWidthInPixel: number = this.state.startClientRect.width + clientX - this.state.startClientX
    const newWidthInPercent: number = newWidthInPixel / this.state.startParentClientRect.width * 100

    this.state.scaling.referenceBox.updateMeasuresAndBorderingLinks({width: newWidthInPercent}, RenderPriority.RESPONSIVE)
  }

  private static dragSouthBorder(clientX: number, clientY: number): void {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const newHeightInPixel: number = this.state.startClientRect.height + clientY - this.state.startClientY
    const newHeightInPercent: number = newHeightInPixel / this.state.startParentClientRect.height * 100

    this.state.scaling.referenceBox.updateMeasuresAndBorderingLinks({height: newHeightInPercent}, RenderPriority.RESPONSIVE)
  }

  private static dragNorthBorder(clientX: number, clientY: number): void {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const dragDistanceInPixel: number = clientY - this.state.startClientY
    const newYInPixel: number = this.state.startClientRect.y - this.state.startParentClientRect.y + dragDistanceInPixel
    const newHeightInPixel: number = this.state.startClientRect.height - dragDistanceInPixel

    const newYInPercent: number = newYInPixel / this.state.startParentClientRect.height * 100
    const newHeightInPercent: number = newHeightInPixel / this.state.startParentClientRect.height * 100

    this.state.scaling.referenceBox.updateMeasuresAndBorderingLinks({y: newYInPercent, height: newHeightInPercent}, RenderPriority.RESPONSIVE)
  }

  private static dragWestBorder(clientX: number, clientY: number): void {
    if (this.state == null) {
      util.logWarning("ScaleManager: state is null while resizing")
      return
    }

    const dragDistanceInPixel: number = clientX - this.state.startClientX
    const newXInPixel: number = this.state.startClientRect.x - this.state.startParentClientRect.x + dragDistanceInPixel
    const newWidthInPixel: number = this.state.startClientRect.width - dragDistanceInPixel

    const newXInPercent: number = newXInPixel / this.state.startParentClientRect.width * 100
    const newWidthInPercent: number = newWidthInPixel / this.state.startParentClientRect.width * 100

    this.state.scaling.referenceBox.updateMeasuresAndBorderingLinks({x: newXInPercent, width: newWidthInPercent}, RenderPriority.RESPONSIVE)
  }

  private static dragEnd(): void {
    if (this.state == null) {
      util.logWarning("ScaleManager: failed to save resize operation, state is null although resizing was in progress")
      return
    }
    this.state.scaling.referenceBox.saveMapData()
    this.state = null
  }

}
