import * as indexHtmlIds from './indexHtmlIds'
import { renderManager } from './renderEngine/renderManager'
import { style } from './styleAdapter'
import { RenderElement, RenderElements } from './renderEngine/RenderElement'
import { util } from './util/util'
import { Widget } from './Widget'

export abstract class PopupWidget extends Widget {
    public readonly id: string
    private readonly title: string
    private readonly onClose: (() => void) | undefined

    public static async buildAndRender(title: string, content: RenderElements, onClose?: () => void): Promise<void> {
        await this.newAndRender({title, content, onClose})
    }

    public static async newAndRender(options: {title: string, content: RenderElements, onClose?: () => void}): Promise<PopupWidget> {
        const widget: PopupWidget = new class extends PopupWidget {
            public constructor() {
                super(options.title.replaceAll("'", '')+util.generateId(), options.title, options.onClose)
            }
            protected override formContent(): RenderElements {
                return options.content
            }
        }
        await widget.render()
        return widget
    }

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
            style: {
                float: 'right',
                marginLeft: '8px'
            },
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
        if (typeof content === 'string') { // in order to keep old PopupWidgets work, would not be interpreted as html otherwise
            content = {
                type: 'div',
                innerHTML: content
            }
        }
        const body: RenderElement = {
            type: 'div',
            style: {
                maxWidth: '90vw',
                maxHeight: '85vh',
                overflow: 'auto'
            },
            children: content
        }

        await renderManager.addElementTo(indexHtmlIds.bodyId, {
            type: 'div',
            id: this.id,
            className: style.getPopupClass(),
            children: [header, body].flat()
        })

        await this.afterRender()
    }

    protected abstract formContent(): RenderElements

    // TODO: remove and simply override render() instead
    protected async afterRender(): Promise<void> {}

    // TODO: remove and simply override render() instead
    protected async beforeUnrender(): Promise<void> {}

    public async unrender(): Promise<void> {
        await this.beforeUnrender()
        await renderManager.remove(this.id)
    }

}
