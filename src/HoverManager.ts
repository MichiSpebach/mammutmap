import { dom } from './domAdapter'
import { Hoverable } from './Hoverable'

export class HoverManager {

  private static state: {
    hovering: Hoverable,
    onHoverOut: () => void
  } | null = null

  public static clear(): void {
    this.state = null
  }

  public static async addHoverable(hoverable: Hoverable, onHoverOver: () => void, onHoverOut: () => void): Promise<void> {
    await dom.addEventListenerTo(hoverable.getId(), 'mouseover', (_clientX: number, _clientY: number) => {
      if (this.state !== null && this.state.hovering === hoverable) {
        return
      }

      if (this.state !== null) {
        this.state.onHoverOut()
      }
      this.state = {hovering: hoverable, onHoverOut}
      onHoverOver()
    })
  }

  public static async removeHoverable(hoverable: Hoverable): Promise<void> {
    await dom.removeEventListenerFrom(hoverable.getId(), 'mouseover')

    if (this.state !== null && this.state.hovering === hoverable) {
      this.state.onHoverOut()
      this.state = null
    }
  }

}
