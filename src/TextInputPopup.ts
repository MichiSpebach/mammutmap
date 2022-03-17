import { renderManager } from './RenderManager'
import { style } from './styleAdapter'
import { util } from './util'

export class TextInputPopup {
    private readonly id: string
    private readonly title: string
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
        this.id = 'textInputPopup'+util.generateId()
        this.title = title
        this.defaultValue = defaultValue
        this.resolve = resolve
    }

    private async render(): Promise<void> {
        let html = `<div id="${this.id}" class="${style.getPopupClass()}">`
        html += `<div style="margin-bottom:5px;">${this.title}<button id="${this.id+'Close'}" style="float:right">X</button></div>`
        html += `<form id="${this.id+'Form'}" onsubmit="return false">` // onsubmit="return false" prevents action from trying to call an url
        html += `<input id="${this.id+'Input'}" value="${this.defaultValue}">`
        html += `<button id="${this.id+'Ok'}">ok</button>`
        html += '</form>'
        html += '</div>'

        await renderManager.addContentTo('body', html)

        await renderManager.addEventListenerTo(this.id+'Close', 'click', async () => {
            this.resolve(undefined)
            this.unrender()
        })
        await renderManager.addEventListenerTo(this.id+'Ok', 'click', async () => {
            const value: string = await renderManager.getValueOf(this.id+'Input')
            this.resolve(value)
            this.unrender()
        })
    }

    private async unrender(): Promise<void> {
        await renderManager.removeEventListenerFrom(this.id+'Close', 'click')
        await renderManager.removeEventListenerFrom(this.id+'Ok', 'click')
        await renderManager.remove(this.id)
    }

}
