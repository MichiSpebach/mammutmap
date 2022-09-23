import { renderManager } from '../../../dist/RenderManager'
import { Widget } from '../../../dist/Widget'
import { DidactedLinkTag, LinkTagMode, linkTagModes } from '../DidactedLinkTag'
import * as linkDidactorSettings from '../linkDidactorSettings'
import { Message } from '../../../dist/pluginFacade'
import { util } from '../../../dist/util'

// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
export class LinkDidactorToolbarViewWidget extends Widget {

    private shouldBeRendered: boolean = false
    private renderedLinkTags: DidactedLinkTag[] = []

    public constructor(
        private readonly id: string
    ) {
        super()
    }

    public getId(): string {
        return this.id
    }

    private getTagModeDropModeId(tag: DidactedLinkTag): string {
        return this.getId()+tag.getName()
    }

    public async render(): Promise<void> {
        if (!this.shouldBeRendered) {
            linkDidactorSettings.linkTags.subscribe(() => this.render())
        }
        this.shouldBeRendered = true
        
        await renderManager.setContentTo(this.getId(), this.formHtml())
        await this.addEventListeners()
    }

    public formHtml(): string {
        const tagsOrMessage: DidactedLinkTag[]|Message = linkDidactorSettings.getLinkTags()
        if (tagsOrMessage instanceof Message) {
            this.renderedLinkTags = []
            return tagsOrMessage.message
        }
        this.renderedLinkTags = tagsOrMessage
        return tagsOrMessage.map(tag => this.formHtmlLineFor(tag)).join('')
    }

    private formHtmlLineFor(tag: DidactedLinkTag): string {
        return `<div>${tag.getName()}(${tag.getCount()}): ${this.formHtmlDropDown(tag)}</div>`
    }

    private formHtmlDropDown(tag: DidactedLinkTag): string {
        let options: string = ''
        for (let mode of linkTagModes) {
            const selected: string = mode === tag.getMode() ? 'selected' : ''
            options += `<option value="${mode}" ${selected}>${mode}</option>`
        }
        return `<select id="${this.getTagModeDropModeId(tag)}">${options}</select>`
    }

    private async addEventListeners(): Promise<void> {
        await Promise.all(this.renderedLinkTags.map(tag => this.addEventListenerForTag(tag)))
    }

    private async addEventListenerForTag(tag: DidactedLinkTag): Promise<void> {
        await renderManager.addChangeListenerTo(this.getTagModeDropModeId(tag), 'value', (value: string) => this.setLinkTagMode(tag, value))
    }

    private async setLinkTagMode(tag: DidactedLinkTag, mode: string): Promise<void> {
        if (!linkTagModes.includes(mode as any)) {
            util.logWarning(`LinkTagMode ${mode} is not known.`)
        }
        tag.setMode(mode as LinkTagMode)
        await linkDidactorSettings.saveToFileSystem()
    }

}
