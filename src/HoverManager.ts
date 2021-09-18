import { dom } from './domAdapter'
import { Box } from './box/Box';

export class HoverManager {

  private static state: {
    hovering: Box,
    onHoverOut: () => void
  } | null = null

  public static clear(): void {
    this.state = null
  }

  public static addHoverable(hoverable: Box, onHoverOver: () => void, onHoverOut: () => void) {
    dom.addEventListenerTo(hoverable.getId(), 'mouseover', (_clientX: number, _clientY: number) => {
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

  public static removeHoverable(hoverable: Box) {
    dom.removeEventListenerFrom(hoverable.getId(), 'mouseover')
  }

}
