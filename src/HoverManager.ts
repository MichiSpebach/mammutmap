import { renderManager } from './RenderManager'
import { Hoverable } from './Hoverable'
import { DragManager } from './DragManager'
import { ScaleManager } from './ScaleManager'

export class HoverManager {

  private static state: {
    hovering: Hoverable,
    onHoverOut: () => void
  } | null = null

  public static isHoveringInProgress(): boolean {
    return !!this.state
  }

  public static clear(): void { // TODO: this method should not be needed, remove when sure
    this.state = null
  }

  public static async addHoverable(hoverable: Hoverable, onHoverOver: () => void, onHoverOut: () => void): Promise<void> {
    await renderManager.addEventListenerTo(hoverable.getId(), 'mouseover', (_clientX: number, _clientY: number) => {
      if (DragManager.isDraggingInProgress() || ScaleManager.isScalingInProgress()) {
        return
      }
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

  public static async removeHoverable(hoverable: Hoverable, callOnHoverOutIfHovered: boolean = false): Promise<void> {
    await renderManager.removeEventListenerFrom(hoverable.getId(), 'mouseover')

    if (this.state !== null && this.state.hovering === hoverable) {
      if (callOnHoverOutIfHovered) {
        this.state.onHoverOut()
      }
      this.state = null
    }
  }

}
