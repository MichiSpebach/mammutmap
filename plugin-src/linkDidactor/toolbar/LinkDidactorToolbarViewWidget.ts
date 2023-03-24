import { renderManager } from '../../../dist/pluginFacade'
import { Widget } from '../../../dist/pluginFacade'
import * as linkDidactorSettings from '../linkDidactorSettings'
import * as pluginFacade from '../../../dist/pluginFacade'
import { Map, Message, Link } from '../../../dist/pluginFacade'
import { coreUtil } from '../../../dist/pluginFacade'
import { RenderElement, RenderElements, createElement, ce, ElementAttributes } from '../../../dist/pluginFacade'
import { LinkTagData } from '../../../dist/pluginFacade'
import { LinkAppearanceMode, linkAppearanceModes } from '../../../dist/pluginFacade'

// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
export class LinkDidactorToolbarViewWidget extends Widget {

    private renderedOrInProgress: boolean = false

    public constructor(
        private readonly id: string
    ) {
        super()
    }

    public getId(): string {
        return this.id
    }

    private getDefaultModeDropDownId(): string {
        return this.getId()+'-mode-default'
    }

    private getTagModeDropDownId(tag: LinkTagData): string {
        return `${this.getId()}-mode-${tag.name}`
    }

    private getDefaultColorDropDownId(): string {
        return this.getId()+'-color-default'
    }

    private getTagColorDropDownId(tag: LinkTagData): string {
        return `${this.getId()}-color-${tag.name}`
    }

    public async render(): Promise<void> {
        if (!this.renderedOrInProgress) {
            linkDidactorSettings.linkTags.subscribe(() => this.render())
            this.renderedOrInProgress = true
        }

        await renderManager.setElementsTo(this.getId(), this.formInner())
    }

    public async unrender(): Promise<void> {
        if (!this.renderedOrInProgress) {
            return
        }
        this.renderedOrInProgress = false

        await renderManager.clearContentOf(this.getId())
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
            return tagsOrMessage.message
        }
        
        const defaultRow: RenderElement = this.formDefaultRow()
        const tagRows: RenderElement[] = tagsOrMessage.map(tag => this.formTagRow(tag))
        const table: RenderElement = createElement('table', {}, [defaultRow, ...tagRows])
        
        if (tagRows.length === 0) {
            return [
                table, 
                ce('div', {}, ['There are no linkTags used in this project yet.']),
                ce('div', {}, ['Right click on links to tag them.']),
                ce('div', {}, ['Right click on boxes to create links.'])
            ]
        } else {
            return table
        }
    }

    private formDefaultRow(): RenderElement {
        const label: string = 'default: '
        const modeDropDown: RenderElement = this.formDefaultModeDropDown()
        const colorDropDown: RenderElement = this.formDefaultColorDropDown()

        return ce('tr', {}, [
            ce('td', this.getLabelAttributes(linkDidactorSettings.getDefaultLinkAppereanceColor()), [label]), 
            ce('td', {}, [modeDropDown]),
            ce('td', {}, [colorDropDown])
        ])
    }

    private formTagRow(tag: LinkTagData): RenderElement {
        const label: string = `${tag.name}(${tag.count}): `
        const modeDropDown: RenderElement = this.formTagModeDropDown(tag)
        const colorDropDown: RenderElement = this.formTagColorDropDown(tag)

        return ce('tr', {}, [
            ce('td', this.getLabelAttributes(tag.appearance.color), [label]), 
            ce('td', {}, [modeDropDown]),
            ce('td', {}, [colorDropDown])
        ])
    }

    private getLabelAttributes(color: string|undefined): ElementAttributes {
        if (!color || color === linkDidactorSettings.boxIdHashColorName) {
            return {}
        }
        return {style: {color}}
    }

    private formDefaultModeDropDown(): RenderElement {
        return createElement('select', {
            id: this.getDefaultModeDropDownId(),
            onchangeValue: (value: string) => this.setDefaultLinkMode(value)
        }, this.formDefaultModeDropDownOptions(linkDidactorSettings.getDefaultLinkAppereanceMode()))
    }

    private formTagModeDropDown(tag: LinkTagData): RenderElement {
        return createElement('select', {
            id: this.getTagModeDropDownId(tag),
            onchangeValue: (value: string) => this.setLinkTagMode(tag, value !== 'undefined' ? value : undefined)
        }, this.formTagModeDropDownOptions(tag.appearance.mode))
    }

    private formDefaultColorDropDown(): RenderElement {
        return createElement('select', {
            id: this.getDefaultColorDropDownId(),
            onchangeValue: (value: string) => this.setDefaultLinkColor(value)
        }, this.formDefaultColorDropDownOptions(linkDidactorSettings.getDefaultLinkAppereanceColor()))
    }

    private formTagColorDropDown(tag: LinkTagData): RenderElement {
        return createElement('select', {
            id: this.getTagColorDropDownId(tag),
            onchangeValue: (value: string) => this.setLinkTagColor(tag, value !== 'undefined' ? value : undefined)
        }, this.formTagColorDropDownOptions(tag.appearance.color))
    }

    private formDefaultModeDropDownOptions(selectedMode: LinkAppearanceMode): RenderElement[] {
        const elements: RenderElement[] = this.formModeDropDownOptions(selectedMode)
        // TODO: implement 'auto' option, links are visible as long as there are currently only rendered/loaded a certain amount
        // elements.push(createElement('option', {value: 'auto', selected: undefined === selectedMode}, ['auto']))
        return elements
    }

    private formTagModeDropDownOptions(selectedMode: LinkAppearanceMode|undefined): RenderElement[] {
        const elements: RenderElement[] = this.formModeDropDownOptions(selectedMode)
        elements.push(createElement('option', {value: undefined, selected: undefined === selectedMode}, ['unset']))
        return elements
    }

    private formModeDropDownOptions(selectedMode: LinkAppearanceMode|undefined): RenderElement[] {
        return linkAppearanceModes.map(mode => createElement('option', {value: mode, selected: mode === selectedMode}, [mode]))
    }

    private formDefaultColorDropDownOptions(selectedColor: string): RenderElement[] {
        const elements: RenderElement[] = this.formColorDropDownOptions(selectedColor)
        return elements
    }

    private formTagColorDropDownOptions(selectedColor: string|undefined): RenderElement[] {
        const elements: RenderElement[] = this.formColorDropDownOptions(selectedColor)
        elements.push(createElement('option', {value: undefined, selected: undefined === selectedColor}, ['unset']))
        return elements
    }

    private formColorDropDownOptions(selectedColor: string|undefined): RenderElement[] {
        return linkDidactorSettings.linkColorOptions.map(color => createElement('option', {value: color, selected: color === selectedColor}, [color]))
    }

    private async setDefaultLinkMode(mode: string|undefined): Promise<void> {
        if (mode && !linkAppearanceModes.includes(mode as any)) {
            coreUtil.logWarning(`default LinkTagMode '${mode}' is not known.`)
        }
        await linkDidactorSettings.setDefaultLinkAppereanceModeAndSave(mode as LinkAppearanceMode)
        await this.rerenderLinks()
    }

    private async setLinkTagMode(tag: LinkTagData, mode: string|undefined): Promise<void> {
        if (mode && !linkAppearanceModes.includes(mode as any)) {
            coreUtil.logWarning(`LinkTagMode '${mode}' is not known.`)
        }
        tag.appearance.mode = (mode as LinkAppearanceMode)
        await linkDidactorSettings.saveToFileSystem()
        await this.rerenderLinks()
    }

    private async setDefaultLinkColor(color: string|undefined): Promise<void> {
        await linkDidactorSettings.setDefaultLinkAppereanceColorAndSave(color)
        await Promise.all([
            this.rerenderLinks(),
            this.render()
        ])
    }

    private async setLinkTagColor(tag: LinkTagData, color: string|undefined): Promise<void> {
        tag.appearance.color = color
        await linkDidactorSettings.saveToFileSystem()
        await Promise.all([
            this.rerenderLinks(),
            this.render()
        ])
    }

    private async rerenderLinks(): Promise<void> {
        const links: Link[] = pluginFacade.getRootFolder().getInnerLinksRecursive().map(boxLinks => boxLinks.getLinks()).flat()
        await Promise.all(links.map(link => link.render()))
    }

}
