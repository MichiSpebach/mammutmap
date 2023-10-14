import { renderManager } from '../../../dist/pluginFacade'
import { Widget } from '../../../dist/pluginFacade'
import * as linkAppearanceSettings from '../linkAppearanceSettings'
import * as pluginFacade from '../../../dist/pluginFacade'
import { Map, Message, Link } from '../../../dist/pluginFacade'
import { coreUtil } from '../../../dist/pluginFacade'
import { RenderElement, RenderElements, Style } from '../../../dist/pluginFacade'
import { LinkTagData } from '../../../dist/pluginFacade'
import { LinkAppearanceMode, linkAppearanceModes } from '../../../dist/pluginFacade'
import { RenderElementWithId, UltimateWidget } from '../../../dist/core/Widget'

// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
export class LinkAppearanceToolbarViewWidget extends UltimateWidget {

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

    public override shape(): { element: RenderElementWithId; rendering?: Promise<void> | undefined } {
        return {
            element: {
                type: 'div',
                id: this.id
            },
            //rendering: this.render() TODO: activate as soon as 'await this.mounting' is implemented
        }
    }

    public async render(): Promise<void> {
        if (!this.renderedOrInProgress) {
            //await this.mounting TODO: activate as soon as 'await this.mounting' is implemented
            linkAppearanceSettings.linkTags.subscribe(() => this.render())
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
        return {type: 'div', children: `Used linkTags in ${projectName}:`}
    }

    private formBody(): RenderElements {
        const tagsOrMessage: LinkTagData[]|Message = linkAppearanceSettings.getLinkTags()
        if (tagsOrMessage instanceof Message) {
            return tagsOrMessage.message
        }
        
        const defaultRow: RenderElement = this.formDefaultRow()
        const tagRows: RenderElement[] = tagsOrMessage.map(tag => this.formTagRow(tag))
        const table: RenderElement = {type: 'table', children: [defaultRow, ...tagRows]}
        
        if (tagRows.length === 0) {
            return [
                table, 
                {type: 'div', children: 'There are no linkTags used in this project yet.'},
                {type: 'div', children: 'Right click on links to tag them.'},
                {type: 'div', children: 'Right click on boxes to create links.'}
            ]
        } else {
            return table
        }
    }

    private formDefaultRow(): RenderElement {
        const label: string = 'default: '
        const modeDropDown: RenderElement = this.formDefaultModeDropDown()
        const colorDropDown: RenderElement = this.formDefaultColorDropDown()

        return {type: 'tr', children: [
            {type: 'td', style: this.getLabelStyle(linkAppearanceSettings.getDefaultLinkAppereanceColor()), children: label}, 
            {type: 'td', children: modeDropDown},
            {type: 'td', children: colorDropDown}
        ]}
    }

    private formTagRow(tag: LinkTagData): RenderElement {
        const label: string = `${tag.name}(${tag.count}): `
        const modeDropDown: RenderElement = this.formTagModeDropDown(tag)
        const colorDropDown: RenderElement = this.formTagColorDropDown(tag)

        return {type: 'tr', children: [
            {type: 'td', style: this.getLabelStyle(tag.appearance.color), children: label}, 
            {type: 'td', children: modeDropDown},
            {type: 'td', children: colorDropDown}
        ]}
    }

    private getLabelStyle(color: string|undefined): Style {
        if (!color || color === linkAppearanceSettings.boxIdHashColorName) {
            return {}
        }
        return {color}
    }

    private formDefaultModeDropDown(): RenderElement {
        return {
            type: 'select',
            id: this.getDefaultModeDropDownId(),
            onchangeValue: (value: string) => this.setDefaultLinkMode(value),
            children: this.formDefaultModeDropDownOptions(linkAppearanceSettings.getDefaultLinkAppereanceMode())
        }
    }

    private formTagModeDropDown(tag: LinkTagData): RenderElement {
        return {
            type: 'select',
            id: this.getTagModeDropDownId(tag),
            onchangeValue: (value: string) => this.setLinkTagMode(tag, value !== 'undefined' ? value : undefined),
            children: this.formTagModeDropDownOptions(tag.appearance.mode)
        }
    }

    private formDefaultColorDropDown(): RenderElement {
        return {
            type: 'select',
            id: this.getDefaultColorDropDownId(),
            onchangeValue: (value: string) => this.setDefaultLinkColor(value),
            children: this.formDefaultColorDropDownOptions(linkAppearanceSettings.getDefaultLinkAppereanceColor())
        }
    }

    private formTagColorDropDown(tag: LinkTagData): RenderElement {
        return {
            type: 'select',
            id: this.getTagColorDropDownId(tag),
            onchangeValue: (value: string) => this.setLinkTagColor(tag, value !== 'undefined' ? value : undefined),
            children: this.formTagColorDropDownOptions(tag.appearance.color)
        }
    }

    private formDefaultModeDropDownOptions(selectedMode: LinkAppearanceMode): RenderElement[] {
        const elements: RenderElement[] = this.formModeDropDownOptions(selectedMode)
        // TODO: implement 'auto' option, links are visible as long as there are currently only rendered/loaded a certain amount
        // elements.push(createElement('option', {value: 'auto', selected: undefined === selectedMode}, ['auto']))
        return elements
    }

    private formTagModeDropDownOptions(selectedMode: LinkAppearanceMode|undefined): RenderElement[] {
        const elements: RenderElement[] = this.formModeDropDownOptions(selectedMode)
        elements.push({
            type: 'option', 
            value: undefined, 
            selected: undefined === selectedMode, 
            children: 'unset'
        })
        return elements
    }

    private formModeDropDownOptions(selectedMode: LinkAppearanceMode|undefined): RenderElement[] {
        return linkAppearanceModes.map(mode => ({
            type: 'option', 
            value: mode, 
            selected: mode === selectedMode, 
            children: mode
        }))
    }

    private formDefaultColorDropDownOptions(selectedColor: string): RenderElement[] {
        const elements: RenderElement[] = this.formColorDropDownOptions(selectedColor)
        return elements
    }

    private formTagColorDropDownOptions(selectedColor: string|undefined): RenderElement[] {
        const elements: RenderElement[] = this.formColorDropDownOptions(selectedColor)
        elements.push({
            type: 'option', 
            value: undefined, 
            selected: undefined === selectedColor, 
            children: 'unset'
        })
        return elements
    }

    private formColorDropDownOptions(selectedColor: string|undefined): RenderElement[] {
        return linkAppearanceSettings.linkColorOptions.map(color => ({
            type: 'option', 
            value: color, 
            selected: color === selectedColor, 
            children: color
        }))
    }

    private async setDefaultLinkMode(mode: string|undefined): Promise<void> {
        if (mode && !linkAppearanceModes.includes(mode as any)) {
            coreUtil.logWarning(`default LinkTagMode '${mode}' is not known.`)
        }
        await linkAppearanceSettings.setDefaultLinkAppereanceModeAndSave(mode as LinkAppearanceMode)
        await this.rerenderLinks()
    }

    private async setLinkTagMode(tag: LinkTagData, mode: string|undefined): Promise<void> {
        if (mode && !linkAppearanceModes.includes(mode as any)) {
            coreUtil.logWarning(`LinkTagMode '${mode}' is not known.`)
        }
        tag.appearance.mode = (mode as LinkAppearanceMode)
        await linkAppearanceSettings.saveToFileSystem()
        await this.rerenderLinks()
    }

    private async setDefaultLinkColor(color: string|undefined): Promise<void> {
        await linkAppearanceSettings.setDefaultLinkAppereanceColorAndSave(color)
        await Promise.all([
            this.rerenderLinks(),
            this.render()
        ])
    }

    private async setLinkTagColor(tag: LinkTagData, color: string|undefined): Promise<void> {
        tag.appearance.color = color
        await linkAppearanceSettings.saveToFileSystem()
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
