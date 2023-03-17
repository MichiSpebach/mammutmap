import { EventListenerCallback, MouseEventListenerCallback, renderManager } from './RenderManager'
import { Hoverable } from './Hoverable'
import { DragManager } from './DragManager'
import { ScaleManager } from './ScaleManager'
import { util } from './util/util'

export class HoverManager {

  private static readonly hoverables: Map<string, EventListenerCallback> = new Map()

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
    if (this.hoverables.has(hoverable.getId())) {
      util.logWarning(`HoverManager::addHoverable(..) hoverable with id '${hoverable.getId()}' already exists.`)
    }

    const mouseoverListener: MouseEventListenerCallback = (_clientX: number, _clientY: number) => {
      this.onMouseOver(hoverable, onHoverOver, onHoverOut)
    }
    this.hoverables.set(hoverable.getId(), mouseoverListener)
    await renderManager.addEventListenerTo(hoverable.getId(), 'mouseover', mouseoverListener)
    
    const elementHovered: boolean = await renderManager.isElementHovered(hoverable.getId())
    if (elementHovered) {
      await this.onMouseOver(hoverable, onHoverOver, onHoverOut)
    }
  }

  private static async onMouseOver(hoverable: Hoverable, onHoverOver: () => void, onHoverOut: () => void): Promise<void> {
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
  }

  public static async removeHoverable(hoverable: Hoverable, callOnHoverOutIfHovered: boolean = false): Promise<void> {
    const listener: EventListenerCallback|undefined = this.hoverables.get(hoverable.getId())
    if (!listener) {
      util.logWarning(`HoverManager::removeHoverable(..) hoverable with id '${hoverable.getId()}' not found.`)
    } else {
      this.hoverables.delete(hoverable.getId())
      await renderManager.removeEventListenerFrom(hoverable.getId(), 'mouseover', {listenerCallback: listener})
    }

    if (this.state !== null && this.state.hovering === hoverable) {
      if (callOnHoverOutIfHovered) {
        this.state.onHoverOut()
      }
      this.state = null
    }
  }

}
