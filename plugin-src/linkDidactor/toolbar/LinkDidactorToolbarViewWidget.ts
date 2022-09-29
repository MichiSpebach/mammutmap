import { renderManager } from '../../../dist/RenderManager'
import { Widget } from '../../../dist/Widget'
import { DidactedLinkTag, LinkTagMode, linkTagModes } from '../DidactedLinkTag'
import * as linkDidactorSettings from '../linkDidactorSettings'
import { Message } from '../../../dist/pluginFacade'
import { util } from '../../../dist/util'
import { RenderElement, createElement } from '../../../dist/util/RenderElement'

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

        await this.clearEventListeners()
        await renderManager.setElementTo(this.getId(), this.form())
    }

    private async clearEventListeners(): Promise<void> {
        await Promise.all(this.renderedLinkTags.map(tag => 
            renderManager.removeEventListenerFrom(this.getTagModeDropModeId(tag), 'change')
        ))
    }

    public form(): RenderElement { // TODO: return list of RenderElement
        const tagsOrMessage: DidactedLinkTag[]|Message = linkDidactorSettings.getLinkTags()
        if (tagsOrMessage instanceof Message) {
            this.renderedLinkTags = []
            return createElement('div', {id: this.getId()+'TagSelections'}, [tagsOrMessage.message]) // TODO: return simple string
        }
        this.renderedLinkTags = tagsOrMessage
        const tagElements: RenderElement[] = tagsOrMessage.map(tag => this.formLineFor(tag))
        return createElement('div', {id: this.getId()+'TagSelections'}, tagElements)
    }

    private formLineFor(tag: DidactedLinkTag): RenderElement {
        const label: string = `${tag.getName()}(${tag.getCount()}): `
        const dropDown: RenderElement = this.formDropDown(tag)

        return createElement('div', {}, [label, dropDown])
    }

    private formDropDown(tag: DidactedLinkTag): RenderElement {
        const options: RenderElement[] = linkTagModes.map(mode => {
            return createElement('option', {value: mode, selected: mode === tag.getMode()}, [mode])
        })
        
        return createElement('select', {
            id: this.getTagModeDropModeId(tag),
            onchangeValue: (value: string) => this.setLinkTagMode(tag, value)
        }, options)
    }

    private async setLinkTagMode(tag: DidactedLinkTag, mode: string): Promise<void> {
        if (!linkTagModes.includes(mode as any)) {
            util.logWarning(`LinkTagMode ${mode} is not known.`)
        }
        tag.setMode(mode as LinkTagMode)
        await linkDidactorSettings.saveToFileSystem()
    }

}
