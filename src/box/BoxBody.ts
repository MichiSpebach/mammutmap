import { dom } from '../domAdapter'
import { settings } from '../Settings'
import { Rect } from '../Rect'
import { Box } from './Box'

export abstract class BoxBody {
  private readonly referenceBox: Box

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public abstract render(): Promise<void>

  protected async shouldBeRendered(): Promise<boolean> {
    const boxRect: Rect = await dom.getClientRectOf(this.referenceBox.getId())
    return this.isRectLargeEnoughToRender(boxRect) && this.isRectInsideScreen(boxRect)
  }

  private isRectLargeEnoughToRender(rect: Rect): boolean {
    return (rect.width+rect.height)/2 >= settings.getBoxMinSizeToRender()
  }

  private isRectInsideScreen(rect: Rect): boolean {
    if (rect.x+rect.width < 0) {
      return false
    }
    if (rect.y+rect.height < 0) {
      return false
    }

    const clientSize = dom.getClientSize()
    if (rect.x > clientSize.width) {
      return false
    }
    if (rect.y > clientSize.height) {
      return false
    }

    return true
  }

}
