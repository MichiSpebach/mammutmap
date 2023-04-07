"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkDidactorToolbarViewWidget = void 0;
const pluginFacade_1 = require("../../../dist/pluginFacade");
const pluginFacade_2 = require("../../../dist/pluginFacade");
const linkDidactorSettings = require("../linkDidactorSettings");
const pluginFacade = require("../../../dist/pluginFacade");
const pluginFacade_3 = require("../../../dist/pluginFacade");
const pluginFacade_4 = require("../../../dist/pluginFacade");
const pluginFacade_5 = require("../../../dist/pluginFacade");
// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
class LinkDidactorToolbarViewWidget extends pluginFacade_2.Widget {
    constructor(id) {
        super();
        this.id = id;
        this.renderedOrInProgress = false;
    }
    getId() {
        return this.id;
    }
    getDefaultModeDropDownId() {
        return this.getId() + '-mode-default';
    }
    getTagModeDropDownId(tag) {
        return `${this.getId()}-mode-${tag.name}`;
    }
    getDefaultColorDropDownId() {
        return this.getId() + '-color-default';
    }
    getTagColorDropDownId(tag) {
        return `${this.getId()}-color-${tag.name}`;
    }
    async render() {
        if (!this.renderedOrInProgress) {
            linkDidactorSettings.linkTags.subscribe(() => this.render());
            this.renderedOrInProgress = true;
        }
        await pluginFacade_1.renderManager.setElementsTo(this.getId(), this.formInner());
    }
    async unrender() {
        if (!this.renderedOrInProgress) {
            return;
        }
        this.renderedOrInProgress = false;
        await pluginFacade_1.renderManager.clearContentOf(this.getId());
    }
    formInner() {
        const mapOrMessage = pluginFacade.getMap();
        if (mapOrMessage instanceof pluginFacade_3.Message) {
            return mapOrMessage.message;
        }
        return [
            this.formHeader(mapOrMessage.getRootFolder().getName()),
            this.formBody()
        ].flat();
    }
    formHeader(projectName) {
        if (projectName.length > 20) {
            projectName = '...' + projectName.substring(projectName.length - 17);
        }
        return { type: 'div', children: `Used linkTags in ${projectName}:` };
    }
    formBody() {
        const tagsOrMessage = linkDidactorSettings.getLinkTags();
        if (tagsOrMessage instanceof pluginFacade_3.Message) {
            return tagsOrMessage.message;
        }
        const defaultRow = this.formDefaultRow();
        const tagRows = tagsOrMessage.map(tag => this.formTagRow(tag));
        const table = { type: 'table', children: [defaultRow, ...tagRows] };
        if (tagRows.length === 0) {
            return [
                table,
                { type: 'div', children: 'There are no linkTags used in this project yet.' },
                { type: 'div', children: 'Right click on links to tag them.' },
                { type: 'div', children: 'Right click on boxes to create links.' }
            ];
        }
        else {
            return table;
        }
    }
    formDefaultRow() {
        const label = 'default: ';
        const modeDropDown = this.formDefaultModeDropDown();
        const colorDropDown = this.formDefaultColorDropDown();
        return { type: 'tr', children: [
                { type: 'td', style: this.getLabelStyle(linkDidactorSettings.getDefaultLinkAppereanceColor()), children: label },
                { type: 'td', children: modeDropDown },
                { type: 'td', children: colorDropDown }
            ] };
    }
    formTagRow(tag) {
        const label = `${tag.name}(${tag.count}): `;
        const modeDropDown = this.formTagModeDropDown(tag);
        const colorDropDown = this.formTagColorDropDown(tag);
        return { type: 'tr', children: [
                { type: 'td', style: this.getLabelStyle(tag.appearance.color), children: label },
                { type: 'td', children: modeDropDown },
                { type: 'td', children: colorDropDown }
            ] };
    }
    getLabelStyle(color) {
        if (!color || color === linkDidactorSettings.boxIdHashColorName) {
            return {};
        }
        return { color };
    }
    formDefaultModeDropDown() {
        return {
            type: 'select',
            id: this.getDefaultModeDropDownId(),
            onchangeValue: (value) => this.setDefaultLinkMode(value),
            children: this.formDefaultModeDropDownOptions(linkDidactorSettings.getDefaultLinkAppereanceMode())
        };
    }
    formTagModeDropDown(tag) {
        return {
            type: 'select',
            id: this.getTagModeDropDownId(tag),
            onchangeValue: (value) => this.setLinkTagMode(tag, value !== 'undefined' ? value : undefined),
            children: this.formTagModeDropDownOptions(tag.appearance.mode)
        };
    }
    formDefaultColorDropDown() {
        return {
            type: 'select',
            id: this.getDefaultColorDropDownId(),
            onchangeValue: (value) => this.setDefaultLinkColor(value),
            children: this.formDefaultColorDropDownOptions(linkDidactorSettings.getDefaultLinkAppereanceColor())
        };
    }
    formTagColorDropDown(tag) {
        return {
            type: 'select',
            id: this.getTagColorDropDownId(tag),
            onchangeValue: (value) => this.setLinkTagColor(tag, value !== 'undefined' ? value : undefined),
            children: this.formTagColorDropDownOptions(tag.appearance.color)
        };
    }
    formDefaultModeDropDownOptions(selectedMode) {
        const elements = this.formModeDropDownOptions(selectedMode);
        // TODO: implement 'auto' option, links are visible as long as there are currently only rendered/loaded a certain amount
        // elements.push(createElement('option', {value: 'auto', selected: undefined === selectedMode}, ['auto']))
        return elements;
    }
    formTagModeDropDownOptions(selectedMode) {
        const elements = this.formModeDropDownOptions(selectedMode);
        elements.push({
            type: 'option',
            value: undefined,
            selected: undefined === selectedMode,
            children: 'unset'
        });
        return elements;
    }
    formModeDropDownOptions(selectedMode) {
        return pluginFacade_5.linkAppearanceModes.map(mode => ({
            type: 'option',
            value: mode,
            selected: mode === selectedMode,
            children: mode
        }));
    }
    formDefaultColorDropDownOptions(selectedColor) {
        const elements = this.formColorDropDownOptions(selectedColor);
        return elements;
    }
    formTagColorDropDownOptions(selectedColor) {
        const elements = this.formColorDropDownOptions(selectedColor);
        elements.push({
            type: 'option',
            value: undefined,
            selected: undefined === selectedColor,
            children: 'unset'
        });
        return elements;
    }
    formColorDropDownOptions(selectedColor) {
        return linkDidactorSettings.linkColorOptions.map(color => ({
            type: 'option',
            value: color,
            selected: color === selectedColor,
            children: color
        }));
    }
    async setDefaultLinkMode(mode) {
        if (mode && !pluginFacade_5.linkAppearanceModes.includes(mode)) {
            pluginFacade_4.coreUtil.logWarning(`default LinkTagMode '${mode}' is not known.`);
        }
        await linkDidactorSettings.setDefaultLinkAppereanceModeAndSave(mode);
        await this.rerenderLinks();
    }
    async setLinkTagMode(tag, mode) {
        if (mode && !pluginFacade_5.linkAppearanceModes.includes(mode)) {
            pluginFacade_4.coreUtil.logWarning(`LinkTagMode '${mode}' is not known.`);
        }
        tag.appearance.mode = mode;
        await linkDidactorSettings.saveToFileSystem();
        await this.rerenderLinks();
    }
    async setDefaultLinkColor(color) {
        await linkDidactorSettings.setDefaultLinkAppereanceColorAndSave(color);
        await Promise.all([
            this.rerenderLinks(),
            this.render()
        ]);
    }
    async setLinkTagColor(tag, color) {
        tag.appearance.color = color;
        await linkDidactorSettings.saveToFileSystem();
        await Promise.all([
            this.rerenderLinks(),
            this.render()
        ]);
    }
    async rerenderLinks() {
        const links = pluginFacade.getRootFolder().getInnerLinksRecursive().map(boxLinks => boxLinks.getLinks()).flat();
        await Promise.all(links.map(link => link.render()));
    }
}
exports.LinkDidactorToolbarViewWidget = LinkDidactorToolbarViewWidget;
