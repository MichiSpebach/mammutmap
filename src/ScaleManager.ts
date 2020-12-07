import * as util from './util'
import * as dom from './domAdapter'
import { BoxBorder } from './box/BoxBorder'

export class ScaleManager {

  private static readonly verticalStyleClass: string = 'nsResize'
  private static readonly horizontalStyleClass: string = 'ewResize'

  private static scalables: Map<string, BoxBorder> = new Map() // TODO: introduce interface Scalable
  private static scaling: BoxBorder|null = null
  private static initialized: boolean = false

  public static init(listenerElementId: string): void {
    // TODO: drag event is captured by box, change dragging of boxes before, or use mousedown events
    dom.addDragListenerTo('map', 'dragstart', (clientX: number, clientY:number, targetId: string): void => {
      util.logInfo('resize start, targetId: ' + targetId)
    })

    dom.addDragListenerTo('map', 'drag', (clientX: number, clientY:number, targetId: string): void => {
      util.logInfo('resize continue, targetId: ' + targetId)
    })

    dom.addDragListenerTo('map', 'dragend', (clientX: number, clientY:number, targetId: string): void => {
      util.logInfo('resize end, targetId: ' + targetId)
    })
  }

  public static addScalable(scalable: BoxBorder) {
    // TODO: set element draggable="true" or use mousedown instead of drag events

    dom.addClassTo(scalable.getTopId(), this.verticalStyleClass)
    dom.addClassTo(scalable.getBottomId(), this.verticalStyleClass)
    dom.addClassTo(scalable.getRightId(), this.horizontalStyleClass)
    dom.addClassTo(scalable.getLeftId(), this.horizontalStyleClass)

    this.scalables.set(scalable.getTopId(), scalable)
    this.scalables.set(scalable.getBottomId(), scalable)
    this.scalables.set(scalable.getRightId(), scalable)
    this.scalables.set(scalable.getLeftId(), scalable)
  }

}
