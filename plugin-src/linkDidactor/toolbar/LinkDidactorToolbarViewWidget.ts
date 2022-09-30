import { renderManager } from '../../../dist/RenderManager'
import { Widget } from '../../../dist/Widget'
import { DidactedLinkTag, LinkTagMode, linkTagModes } from '../DidactedLinkTag'
import * as linkDidactorSettings from '../linkDidactorSettings'
import * as pluginFacade from '../../../dist/pluginFacade'
import { Map, Message } from '../../../dist/pluginFacade'
import { util } from '../../../dist/util'
import { RenderElement, RenderElements, createElement } from '../../../dist/util/RenderElement'

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
        await renderManager.setElementsTo(this.getId(), this.form())
    }

    private async clearEventListeners(): Promise<void> {
        await Promise.all(this.renderedLinkTags.map(tag => 
            renderManager.removeEventListenerFrom(this.getTagModeDropModeId(tag), 'change')
        ))
    }

    public form(): RenderElements {
        const mapOrMessage: Map|Message = pluginFacade.getMap()
        if (mapOrMessage instanceof Message) {
            return mapOrMessage.message
        }
        
        return [
            this.formHeader(mapOrMessage.getRootFolder().getName()),
            this.formBody()
        ].flat()
    }

    private formHeader(projectName: string): RenderElement {
        if (projectName.length > 20) {
            projectName = '...'+projectName.substring(projectName.length-17)
        }
        return createElement('div', {}, [`Used linkTags in ${projectName}:`])
    }

    private formBody(): RenderElements {
        const tagsOrMessage: DidactedLinkTag[]|Message = linkDidactorSettings.getLinkTags()
        if (tagsOrMessage instanceof Message) {
            this.renderedLinkTags = []
            return tagsOrMessage.message
        }

        this.renderedLinkTags = tagsOrMessage
        if (tagsOrMessage.length === 0) {
            return 'There are no linkTags used in this project yet, right click on links to tag them.'
        }

        const tagElements: RenderElement[] = tagsOrMessage.map(tag => this.formLine(tag))
        return tagElements
    }

    private formLine(tag: DidactedLinkTag): RenderElement {
        const label: string = `${tag.getName()}(${tag.getCount()}): `
        const dropDown: RenderElement = this.formDropDown(tag)

        return createElement('div', {}, [label, dropDown])
    }

    private formDropDown(tag: DidactedLinkTag): RenderElement {
        return createElement('select', {
            id: this.getTagModeDropModeId(tag),
            onchangeValue: (value: string) => this.setLinkTagMode(tag, value)
        }, this.formDropDownOptions(tag))
    }

    private formDropDownOptions(tag: DidactedLinkTag): RenderElement[] {
        return linkTagModes.map(mode => createElement('option', {value: mode, selected: mode === tag.getMode()}, [mode]))
    }

    private async setLinkTagMode(tag: DidactedLinkTag, mode: string): Promise<void> {
        if (!linkTagModes.includes(mode as any)) {
            util.logWarning(`LinkTagMode ${mode} is not known.`)
        }
        tag.setMode(mode as LinkTagMode)
        await linkDidactorSettings.saveToFileSystem()
    }

}
