import { PopupWidget } from './PopupWidget'
import { renderManager } from './RenderManager'
import { util } from './util/util'

export class TextInputPopup extends PopupWidget {
    private readonly defaultValue: string
    private readonly resolve: (text: string|undefined) => void

    public static async buildAndRenderAndAwaitResolve(title: string, defaultValue: string): Promise<string|undefined> {
        let resolvePromise: (value: string|undefined) => void
        const promise: Promise<string|undefined> = new Promise((resolve: (value: string|undefined) => void) => {
            resolvePromise = resolve
        })
        const popup = new TextInputPopup(title, defaultValue, (text: string|undefined) => resolvePromise(text))
        await popup.render()
        return promise
    }

    private constructor(title: string, defaultValue: string, resolve: (text: string|undefined) => void) {
        super('textInputPopup'+util.generateId(), title, () => resolve(undefined))
        this.defaultValue = defaultValue
        this.resolve = resolve
    }

    protected formContent(): string {
      let html = `<form id="${this.getId()+'Form'}" onsubmit="return false">` // onsubmit="return false" prevents action from trying to call an url
      html += `<input onfocus="this.select()" id="${this.getId()+'Input'}" value="${this.defaultValue}" autofocus>` // TODO: autofocus only works once
      html += `<button id="${this.getId()+'Ok'}">ok</button>`
      html += '</form>'
      return html
    }

    protected override async afterRender(): Promise<void> {
        await renderManager.addEventListenerTo(this.getId()+'Ok', 'click', async () => {
            const value: string = await renderManager.getValueOf(this.getId()+'Input')
            this.resolve(value)
            this.unrender()
        })
    }

    protected override async beforeUnrender(): Promise<void> {
        await renderManager.removeEventListenerFrom(this.getId()+'Ok', 'click')
    }

}
