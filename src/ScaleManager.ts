import * as util from './util'
import * as dom from './domAdapter'
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

    dom.addDragListenerTo(scalable.getRightId(), 'dragstart', async (clientX: number, clientY:number): Promise<void> => {
      util.logInfo('resize start, targetId: ' + scalable.getRightId())

      let parentClientRect: Promise<Rect> = scalable.referenceBox.getParent().getClientRect()
      let clientRect: Promise<Rect> = scalable.referenceBox.getClientRect()

      this.state = {
        scaling: scalable,
        startParentClientRect: await parentClientRect,
        startClientRect: await clientRect,
        startClientX: clientX,
        startClientY: clientY
      }
    })

    dom.addDragListenerTo(scalable.getRightId(), 'drag', (clientX: number, clientY:number): void => {
      //util.logInfo('resize continue, targetId: ' + scalable.getRightId())
      if (this.state == null) {
        util.logWarning("ScaleManager: state is null")
        return
      }

      const newWidthPercent: number = (this.state.startClientRect.width + clientX - this.state.startClientX) / this.state.startParentClientRect.width * 100
      this.state.scaling.referenceBox.updateWidth(newWidthPercent)
    })

    dom.addDragListenerTo(scalable.getRightId(), 'dragend', (clientX: number, clientY:number): void => {
      util.logInfo('resize end, targetId: ' + scalable.getRightId())
      this.state = null
    })

    //this.scalables.set(scalable.getTopId(), scalable)
    //this.scalables.set(scalable.getBottomId(), scalable)
    //this.scalables.set(scalable.getRightId(), scalable)
    //this.scalables.set(scalable.getLeftId(), scalable)
  }

}
