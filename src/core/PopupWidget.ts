import * as indexHtmlIds from './indexHtmlIds'
import { renderManager } from './RenderManager'
import { style } from './styleAdapter'
import { Widget } from './Widget'

export abstract class PopupWidget extends Widget {
    private readonly id: string
    private readonly title: string
    private readonly onClose: (() => void) | undefined

    protected constructor(id: string, title: string, onClose?: (() => void)) {
        super()
        this.id = id
        this.title = title
        this.onClose = onClose
    }

    public getId(): string {
        return this.id
    }

    public async render(): Promise<void> {
        let html = `<div id="${this.id}" class="${style.getPopupClass()}">`
        html += `<div style="margin-bottom:5px;">${this.title}<button id="${this.id+'Close'}" style="float:right">X</button></div>`
        html += this.formContentHtml()
        html += '</div>'

        await renderManager.addContentTo(indexHtmlIds.bodyId, html)

        await renderManager.addEventListenerTo(this.id+'Close', 'click', async () => {
            if (this.onClose) {
                this.onClose()
            }
            this.unrender()
        })

        await this.afterRender()
    }

    protected abstract formContentHtml(): string

    protected abstract afterRender(): Promise<void>

    protected abstract beforeUnrender(): Promise<void>

    public async unrender(): Promise<void> {
        await this.beforeUnrender()
        await renderManager.removeEventListenerFrom(this.id+'Close', 'click')
        await renderManager.remove(this.id)
    }

}
