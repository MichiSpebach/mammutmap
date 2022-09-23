import { renderManager } from '../../../dist/RenderManager'
import { Widget } from '../../../dist/Widget'
import { DidactedLinkTag } from '../DidactedLinkTag'
import * as linkDidactorSettings from '../linkDidactorSettings'
import { Message } from '../../../dist/pluginFacade'

// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
export class LinkDidactorToolbarViewWidget extends Widget {

    private shouldBeRendered: boolean = false

    public constructor(
        private readonly id: string
    ) {
        super()
    }

    public getId(): string {
        return this.id
    }

    public async render(): Promise<void> {
        if (!this.shouldBeRendered) {
            linkDidactorSettings.linkTags.subscribe(() => this.render())
        }
        this.shouldBeRendered = true
        await renderManager.setContentTo(this.getId(), this.formHtml())
    }

    public formHtml(): string {
        const tagsOrMessage: DidactedLinkTag[]|Message = linkDidactorSettings.getLinkTags()
        if (tagsOrMessage instanceof Message) {
            return tagsOrMessage.message
        }
        return tagsOrMessage.map(tag => this.formHtmlLineFor(tag)).join('')
    }

    private formHtmlLineFor(tag: DidactedLinkTag): string {
        return `<div>${tag.getName()}: ${tag.getMode()}</div>`
    }

}
