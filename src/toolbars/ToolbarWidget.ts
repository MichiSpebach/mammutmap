import { renderManager } from '../RenderManager'
import { Widget } from '../Widget'
import { ToolbarView } from './ToolbarView'

export class ToolbarWidget extends Widget {
  private readonly id: string
  private readonly views: ToolbarView[] = []
  private selectedView: ToolbarView|undefined

  public constructor(id: string) {
    super()
    this.id = id
  }

  public getId(): string {
    return this.id
  }

  public addView(view: ToolbarView): void {
    this.views.push(view)
  }

  public async render(): Promise<void> {
    if (this.views.length === 0) {
      await renderManager.setContentTo(this.getId(), 'no ToolbarViews added')
      return
    }
    if (!this.selectedView) {
      this.selectedView = this.views[0]
    }

    let html = this.formHeaderHtml()
    html += `<div id="${this.selectedView.getWidget().getId()}"></div>`

    await renderManager.setContentTo(this.getId(), html)
    await this.selectedView.getWidget().render()
  }

  private formHeaderHtml(): string {
    let html = ''

    for (const view of this.views) {
      if (view === this.selectedView) {
        html += `<span><b>${view.getName()}</b></span>`
      } else {
        html += `<span>${view.getName()}</span>`
      }
    }

    return html
  }

}
