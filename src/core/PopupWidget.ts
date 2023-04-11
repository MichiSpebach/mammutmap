import * as indexHtmlIds from './indexHtmlIds'
import { renderManager } from './RenderManager'
import { style } from './styleAdapter'
import { RenderElement, RenderElements } from './util/RenderElement'
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
        const closeButton: RenderElement = {
            type: 'button',
            id: this.id+'Close',
            style: {float: 'right'},
            onclick: () => {
                if (this.onClose) {
                    this.onClose()
                }
                this.unrender()
            },
            children: 'X'
        }
        const header: RenderElement = {
            type: 'div',
            style: {marginBottom: '5px'},
            children: [this.title, closeButton]
        }

        let content: RenderElements = this.formContent()
        if (typeof content === 'string') { // in order to keep old PopupWidgets work
            content = {
                type: 'div',
                innerHTML: content
            }
        }

        await renderManager.addElementTo(indexHtmlIds.bodyId, {
            type: 'div',
            id: this.id,
            className: style.getPopupClass(),
            children: [header, content].flat()
        })

        await this.afterRender()
    }

    protected abstract formContent(): RenderElements

    protected abstract afterRender(): Promise<void>

    protected abstract beforeUnrender(): Promise<void>

    public async unrender(): Promise<void> {
        await this.beforeUnrender()
        await renderManager.remove(this.id)
    }

}
