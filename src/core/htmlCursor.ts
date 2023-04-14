import * as indexHtmlIds from './indexHtmlIds'
import { MouseEventResultAdvanced, renderManager, RenderPriority } from './RenderManager'
import { Style } from './util/RenderElement'

const id: string = 'htmlCursor'
let activated: boolean = false

export async function activate(): Promise<void> {
  if (activated) {
    return
  }
  activated = true

  await renderManager.addElementTo(indexHtmlIds.bodyId, {
    type: 'div',
    id,
    style: getStyle(),
    children: {
      type: 'div',
      style: {
        width: '15px',
        height: '20px',
        backgroundColor: 'white',
        clipPath: 'polygon(0 0, 100% 66%, 39% 66%, 0 100%)'
      }
    }
  });

  await renderManager.addEventListenerAdvancedTo(indexHtmlIds.bodyId, 'mousemove', {capture: true, stopPropagation: false}, (eventResult: MouseEventResultAdvanced) => {
    setPosition(eventResult.position.x, eventResult.position.y)
  })
  await renderManager.addEventListenerAdvancedTo(indexHtmlIds.bodyId, 'mousedown', {capture: true, stopPropagation: false}, () => {
    addMousedownElement()
  })
  await renderManager.addEventListenerAdvancedTo(indexHtmlIds.bodyId, 'mouseup', {capture: true, stopPropagation: false}, () => {
    removeMousedownElement()
  })
}

export async function deactivate(): Promise<void> {
  if (!activated) {
    return
  }
  activated = false

  await renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mousemove')
  await renderManager.remove(id)
}

function getStyle(): Style {
  return {
    position: 'fixed',
    pointerEvents: 'none'
  }
}

async function setPosition(clientX: number, clientY: number): Promise<void> {
  const style: Style = getStyle()
  style.left = clientX+'px'
  style.top = clientY+'px'
  await renderManager.setStyleTo(id, style, RenderPriority.RESPONSIVE)
}

async function addMousedownElement(): Promise<void> {
  await renderManager.addElementTo(id, {
    type: 'div',
    id: id+'Mousedown',
    style: {
      width: '10px',
      height: '10px',
      backgroundColor: 'white'
    }
  }, RenderPriority.RESPONSIVE)
}

async function removeMousedownElement(): Promise<void> {
  await renderManager.remove(id+'Mousedown', RenderPriority.RESPONSIVE)
}