import { renderManager } from '../../RenderManager'
import { relocationDragManager } from '../../RelocationDragManager'
import { Box } from '../Box'
import { style } from '../../styleAdapter'
import { settings } from '../../Settings'
import { BoxHeaderDraggable } from './BoxHeaderDraggable'

export abstract  class BoxHeader {
  public readonly referenceBox: Box
  private readonly draggable: BoxHeaderDraggable
  private rendered: boolean = false

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
    this.draggable = new BoxHeaderDraggable(this.getId()+'Inner', this.referenceBox)
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
    return [style.getBoxHeaderInnerClass()]
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
