import { renderManager } from '../../../dist/RenderManager'
import { Widget } from '../../../dist/Widget'
import * as linkDidactorSettings from '../linkDidactorSettings'
import * as pluginFacade from '../../../dist/pluginFacade'
import { Map, Message, Link } from '../../../dist/pluginFacade'
import { util } from '../../../dist/util'
import { RenderElement, RenderElements, createElement, ce } from '../../../dist/util/RenderElement'
import { LinkTagData } from '../../../dist/mapData/LinkTagData'
import { LinkAppearanceMode, linkAppearanceModes } from '../../../dist/mapData/LinkAppearanceData'

// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
export class LinkDidactorToolbarViewWidget extends Widget {

    private renderedOrInProgress: boolean = false
    private renderedLinkTags: LinkTagData[] = []

    public constructor(
        private readonly id: string
    ) {
        super()
    }

    public getId(): string {
        return this.id
    }

    private getDefaultModeDropDownId(): string {
        return this.getId()+'-default'
    }

    private getTagModeDropDownId(tag: LinkTagData): string {
        return this.getId()+tag.name
    }

    public async render(): Promise<void> {
        if (!this.renderedOrInProgress) {
            linkDidactorSettings.linkTags.subscribe(() => this.render())
            this.renderedOrInProgress = true
        }

        await this.clearEventListeners()
        await renderManager.setElementsTo(this.getId(), this.formInner())
    }

    public async unrender(): Promise<void> {
        if (!this.renderedOrInProgress) {
            return
        }
        this.renderedOrInProgress = false

        await Promise.all([
            this.clearEventListeners(),
            renderManager.clearContentOf(this.getId()),
            this.renderedLinkTags = []
        ])
    }

    private async clearEventListeners(): Promise<void> {
        await Promise.all(this.renderedLinkTags.map(tag => 
            renderManager.removeEventListenerFrom(this.getTagModeDropDownId(tag), 'change')
        ))
    }

    public formInner(): RenderElements {
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
        const tagsOrMessage: LinkTagData[]|Message = linkDidactorSettings.getLinkTags()
        if (tagsOrMessage instanceof Message) {
            this.renderedLinkTags = []
            return tagsOrMessage.message
        }

        this.renderedLinkTags = tagsOrMessage
        
        const defaultRow: RenderElement = this.formDefaultRow()
        const tagRows: RenderElement[] = tagsOrMessage.map(tag => this.formTagRow(tag))
        const table: RenderElement = createElement('table', {}, [defaultRow, ...tagRows])
        
        if (tagRows.length === 0) {
            return [table, 'There are no linkTags used in this project yet, right click on links to tag them.']
        } else {
            return table
        }
    }

    private formDefaultRow(): RenderElement {
        const label: string = 'default: '
        const dropDown: RenderElement = this.formDefaultModeDropDown()

        return ce('tr', {}, [
            ce('td', {}, [label]), 
            ce('td', {}, [dropDown])
        ])
    }

    private formTagRow(tag: LinkTagData): RenderElement {
        const label: string = `${tag.name}(${tag.count}): `
        const dropDown: RenderElement = this.formTagModeDropDown(tag)

        return ce('tr', {}, [
            ce('td', {}, [label]), 
            ce('td', {}, [dropDown])
        ])
    }

    private formDefaultModeDropDown(): RenderElement {
        return createElement('select', {
            id: this.getDefaultModeDropDownId(),
            onchangeValue: (value: string) => this.setDefaultLinkMode(value)
        }, this.formDropDownOptions(linkDidactorSettings.getDefaultLinkAppereance().getMode()))
    }

    private formTagModeDropDown(tag: LinkTagData): RenderElement {
        return createElement('select', {
            id: this.getTagModeDropDownId(tag),
            onchangeValue: (value: string) => this.setLinkTagMode(tag, value)
        }, this.formDropDownOptions(tag.appearance.getMode()))
    }

    private formDropDownOptions(tagMode: LinkAppearanceMode): RenderElement[] {
        return linkAppearanceModes.map(mode => createElement('option', {value: mode, selected: mode === tagMode}, [mode]))
    }

    private async setDefaultLinkMode(mode: string): Promise<void> {
        if (!linkAppearanceModes.includes(mode as any)) {
            util.logWarning(`default LinkTagMode '${mode}' is not known.`)
        }
        linkDidactorSettings.getDefaultLinkAppereance().setMode(mode as LinkAppearanceMode)
        await linkDidactorSettings.saveToFileSystem()
        await this.rerenderLinks()
    }

    private async setLinkTagMode(tag: LinkTagData, mode: string): Promise<void> {
        if (!linkAppearanceModes.includes(mode as any)) {
            util.logWarning(`LinkTagMode '${mode}' is not known.`)
        }
        tag.appearance.setMode(mode as LinkAppearanceMode)
        await linkDidactorSettings.saveToFileSystem()
        await this.rerenderLinks()
    }

    private async rerenderLinks(): Promise<void> {
        const links: Link[] = pluginFacade.getRootFolder().getInnerLinksRecursive().map(boxLinks => boxLinks.getLinks()).flat()
        await Promise.all(links.map(link => link.render()))
    }

}
