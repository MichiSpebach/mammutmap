import { renderManager } from '../../renderEngine/renderManager'
import { relocationDragManager } from '../../RelocationDragManager'
import { Box } from '../Box'
import { style } from '../../styleAdapter'
import { settings } from '../../settings/settings'
import { BoxHeaderDraggable } from './BoxHeaderDraggable'
import { Widget } from '../../Widget'
import * as styles from './BoxHeaderStyle'
import { Style } from '../../renderEngine/RenderElement'
import { log } from '../../../core/logService'
import { util } from '../../../core/util/util'

export abstract  class BoxHeader extends Widget {
  private static getStyleClassName: (style: Style) => string
  public readonly referenceBox: Box
  private readonly draggable: BoxHeaderDraggable
  private rendered: boolean = false

  public constructor(referenceBox: Box) {
    super()
    this.referenceBox = referenceBox
    this.draggable = new BoxHeaderDraggable(this.getId()+'Inner', this.referenceBox)

    if (!BoxHeader.getStyleClassName) {
      const prefix = BoxHeader.name + util.generateId()
      renderManager.addStyleSheet(/*prefix,*/ styles) // TODO: return StyleSheet object with getName(style: Style): string method
      BoxHeader.getStyleClassName = (style: Style): string => {
        for (const [key, value] of Object.entries(styles)) {
          if (value === style) {
            return /*prefix+*/key // TODO: add prefix to have unique classnames
          }
        }
        log.warning(`style is not registered as styleClass, returning empty string.`)
        return ''
      }
    }
  }

  public getId(): string {
    return this.referenceBox.getId()+'Header'
  }

  public async render(): Promise<void> {
    const proms: Promise<any>[] = []

    const draggableHtml: string = relocationDragManager.isUsingNativeDragEvents() && !this.referenceBox.isRoot()
      ? 'draggable="true"'
      : ''

    let html: string = `<div id="${this.getId()+'Inner'}" ${draggableHtml} class="${this.getInnerStyleClassNames().join(' ')}">`
    html += this.formTitleHtml()
    html += '</div>'
    proms.push(renderManager.setContentTo(this.getId(), html))

    if (!this.rendered) {
      if (!this.referenceBox.isRoot()) {
        proms.push(relocationDragManager.addDraggable(this.draggable))
      }
      this.rendered = true
    }

    await Promise.all(proms)
  }

  protected getInnerStyleClassNames(): string[] {
    return [style.getBoxHeaderInnerClass(), BoxHeader.getStyleClassName(styles.boxHeaderInner)]
  }

  public formTitleHtml(): string {
    return settings.getBoolean('developerMode')
      ? `${this.referenceBox.getName()} (${this.referenceBox.getId()})`
      : this.referenceBox.getName()
  }

  public async unrender(): Promise<void> {
    if (!this.rendered) {
      return
    }
    if (!this.referenceBox.isRoot()) {
      await relocationDragManager.removeDraggable(this.draggable)
    }
    this.rendered = false // TODO: implement rerenderAfter(Un)RenderFinished mechanism?
  }

}
