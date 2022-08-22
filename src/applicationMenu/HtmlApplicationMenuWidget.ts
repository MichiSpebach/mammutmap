import { renderManager } from '../RenderManager'
import { Widget } from '../Widget'

export class HtmlApplicationMenuWidget extends Widget {

    private readonly id: string

    public constructor(id: string) {
        super()
        this.id = id
    }

    public getId(): string {
        return this.id
    }

    public async render(): Promise<void> {
        await renderManager.addContentTo(this.getId(), `<div>HtmlApplicationMenu work in progress</div>`)
    }

}