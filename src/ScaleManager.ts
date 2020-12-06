import * as util from './util'
import * as dom from './domAdapter'
import { BoxBorder } from './box/BoxBorder'

export class ScaleManager {

  private static readonly verticalStyleClass: string = 'nsResize'
  private static readonly horizontalStyleClass: string = 'ewResize'

  private static scalables: Map<string, BoxBorder> = new Map() // TODO: introduce interface Scalable
  private static scaling: BoxBorder|null = null

  public static addScalable(scalable: BoxBorder) {
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
