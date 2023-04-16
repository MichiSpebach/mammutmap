import * as indexHtmlIds from './indexHtmlIds'
import { MouseEventResultAdvanced, renderManager, RenderPriority } from './RenderManager'
import { Style } from './util/RenderElement'
import { util } from './util/util'

const id: string = 'htmlCursor'
let activated: boolean = false
let mousedownElementVisible: boolean = false

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

  await Promise.all([
    renderManager.addEventListenerAdvancedTo(indexHtmlIds.bodyId, 'mousemove', {capture: true, stopPropagation: false}, setPosition),
    renderManager.addEventListenerAdvancedTo(indexHtmlIds.bodyId, 'mousedown', {capture: true, stopPropagation: false}, addMousedownElement),
    renderManager.addEventListenerAdvancedTo(indexHtmlIds.bodyId, 'mouseup', {capture: true, stopPropagation: false}, removeMousedownElement)
  ])
}

export async function deactivate(): Promise<void> {
  if (!activated) {
    return
  }
  activated = false

  await Promise.all([
    renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mousemove', {listenerCallback: setPosition}),
    renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mousedown', {listenerCallback: addMousedownElement}),
    renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mouseup', {listenerCallback: removeMousedownElement}),
    renderManager.remove(id)
  ])
}

function getStyle(): Style {
  return {
    position: 'fixed',
    pointerEvents: 'none'
  }
}

async function setPosition(eventResult: MouseEventResultAdvanced): Promise<void> {
  const style: Style = getStyle()
  style.left = eventResult.position.x+'px'
  style.top = eventResult.position.y+'px'
  await renderManager.setStyleTo(id, style, RenderPriority.RESPONSIVE)
}

async function addMousedownElement(): Promise<void> {
  if (mousedownElementVisible) {
    util.logWarning('htmlCursor::addMousedownElement() called although mousedownElement is already visible.')
    return
  }
  mousedownElementVisible = true

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
  if (!mousedownElementVisible) {
    //util.logWarning('htmlCursor::removeMousedownElement() called although mousedownElement is not visible.') // happens with puppeteer
    return
  }
  mousedownElementVisible = false

  await renderManager.remove(id+'Mousedown', RenderPriority.RESPONSIVE)
}