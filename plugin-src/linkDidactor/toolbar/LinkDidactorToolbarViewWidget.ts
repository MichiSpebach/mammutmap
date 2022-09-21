import { renderManager } from '../../../dist/RenderManager'
import { Widget } from '../../../dist/Widget'
import { DidactedLinkTag } from '../DidactedLinkTag'
import * as linkDidactorSettings from '../linkDidactorSettings'

// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
export class LinkDidactorToolbarViewWidget extends Widget {

    public constructor(
        private readonly id: string
    ) {
        super()
    }

    public getId(): string {
        return this.id
    }

    public async render(): Promise<void> {
        await renderManager.setContentTo(this.getId(), this.formHtml())
    }

    public formHtml(): string {
        return linkDidactorSettings.getLinkTags().map(tag => this.formHtmlLineFor(tag)).join('')
    }

    private formHtmlLineFor(tag: DidactedLinkTag): string {
        return `<div>${tag.getName()}: ${tag.getMode()}</div>`
    }

}
