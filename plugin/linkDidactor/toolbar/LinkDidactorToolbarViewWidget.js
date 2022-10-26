"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkDidactorToolbarViewWidget = void 0;
const RenderManager_1 = require("../../../dist/RenderManager");
const Widget_1 = require("../../../dist/Widget");
const linkDidactorSettings = require("../linkDidactorSettings");
const pluginFacade = require("../../../dist/pluginFacade");
const pluginFacade_1 = require("../../../dist/pluginFacade");
const util_1 = require("../../../dist/util");
const RenderElement_1 = require("../../../dist/util/RenderElement");
const LinkAppearanceData_1 = require("../../../dist/mapData/LinkAppearanceData");
// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
class LinkDidactorToolbarViewWidget extends Widget_1.Widget {
    constructor(id) {
        super();
        this.id = id;
        this.renderedOrInProgress = false;
        this.elementIdsWithChangeEventListeners = [];
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
        await this.clearEventListeners();
        await RenderManager_1.renderManager.setElementsTo(this.getId(), this.formInner());
    }
    async unrender() {
        if (!this.renderedOrInProgress) {
            return;
        }
        this.renderedOrInProgress = false;
        await Promise.all([
            this.clearEventListeners(),
            RenderManager_1.renderManager.clearContentOf(this.getId()),
        ]);
    }
    async clearEventListeners() {
        await Promise.all(this.elementIdsWithChangeEventListeners.map(elementId => RenderManager_1.renderManager.removeEventListenerFrom(elementId, 'change')));
        this.elementIdsWithChangeEventListeners = [];
    }
    formInner() {
        const mapOrMessage = pluginFacade.getMap();
        if (mapOrMessage instanceof pluginFacade_1.Message) {
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
        return (0, RenderElement_1.createElement)('div', {}, [`Used linkTags in ${projectName}:`]);
    }
    formBody() {
        const tagsOrMessage = linkDidactorSettings.getLinkTags();
        if (tagsOrMessage instanceof pluginFacade_1.Message) {
            return tagsOrMessage.message;
        }
        const defaultRow = this.formDefaultRow();
        const tagRows = tagsOrMessage.map(tag => this.formTagRow(tag));
        const table = (0, RenderElement_1.createElement)('table', {}, [defaultRow, ...tagRows]);
        if (tagRows.length === 0) {
            return [table, 'There are no linkTags used in this project yet, right click on links to tag them.'];
        }
        else {
            return table;
        }
    }
    formDefaultRow() {
        const label = 'default: ';
        const modeDropDown = this.formDefaultModeDropDown();
        const colorDropDown = this.formDefaultColorDropDown();
        return (0, RenderElement_1.ce)('tr', {}, [
            (0, RenderElement_1.ce)('td', {}, [label]),
            (0, RenderElement_1.ce)('td', {}, [modeDropDown]),
            (0, RenderElement_1.ce)('td', {}, [colorDropDown])
        ]);
    }
    formTagRow(tag) {
        const label = `${tag.name}(${tag.count}): `;
        const modeDropDown = this.formTagModeDropDown(tag);
        const colorDropDown = this.formTagColorDropDown(tag);
        return (0, RenderElement_1.ce)('tr', {}, [
            (0, RenderElement_1.ce)('td', {}, [label]),
            (0, RenderElement_1.ce)('td', {}, [modeDropDown]),
            (0, RenderElement_1.ce)('td', {}, [colorDropDown])
        ]);
    }
    formDefaultModeDropDown() {
        const elementId = this.getDefaultModeDropDownId();
        this.elementIdsWithChangeEventListeners.push(elementId);
        return (0, RenderElement_1.createElement)('select', {
            id: elementId,
            onchangeValue: (value) => this.setDefaultLinkMode(value)
        }, this.formDefaultModeDropDownOptions(linkDidactorSettings.getDefaultLinkAppereanceMode()));
    }
    formTagModeDropDown(tag) {
        const elementId = this.getTagModeDropDownId(tag);
        this.elementIdsWithChangeEventListeners.push(elementId);
        return (0, RenderElement_1.createElement)('select', {
            id: elementId,
            onchangeValue: (value) => this.setLinkTagMode(tag, value !== 'undefined' ? value : undefined)
        }, this.formTagModeDropDownOptions(tag.appearance.mode));
    }
    formDefaultColorDropDown() {
        const elementId = this.getDefaultColorDropDownId();
        this.elementIdsWithChangeEventListeners.push(elementId);
        return (0, RenderElement_1.createElement)('select', {
            id: elementId,
            onchangeValue: (value) => this.setDefaultLinkColor(value)
        }, this.formDefaultColorDropDownOptions(linkDidactorSettings.getDefaultLinkAppereanceColor()));
    }
    formTagColorDropDown(tag) {
        const elementId = this.getTagColorDropDownId(tag);
        this.elementIdsWithChangeEventListeners.push(elementId);
        return (0, RenderElement_1.createElement)('select', {
            id: elementId,
            onchangeValue: (value) => this.setLinkTagColor(tag, value !== 'undefined' ? value : undefined)
        }, this.formTagColorDropDownOptions(tag.appearance.color));
    }
    formDefaultModeDropDownOptions(selectedMode) {
        const elements = this.formModeDropDownOptions(selectedMode);
        // TODO: implement 'auto' option, links are visible as long as there are currently only rendered/loaded a certain amount
        // elements.push(createElement('option', {value: 'auto', selected: undefined === selectedMode}, ['auto']))
        return elements;
    }
    formTagModeDropDownOptions(selectedMode) {
        const elements = this.formModeDropDownOptions(selectedMode);
        elements.push((0, RenderElement_1.createElement)('option', { value: undefined, selected: undefined === selectedMode }, ['unset']));
        return elements;
    }
    formModeDropDownOptions(selectedMode) {
        return LinkAppearanceData_1.linkAppearanceModes.map(mode => (0, RenderElement_1.createElement)('option', { value: mode, selected: mode === selectedMode }, [mode]));
    }
    formDefaultColorDropDownOptions(selectedColor) {
        const elements = this.formColorDropDownOptions(selectedColor);
        return elements;
    }
    formTagColorDropDownOptions(selectedColor) {
        const elements = this.formColorDropDownOptions(selectedColor);
        elements.push((0, RenderElement_1.createElement)('option', { value: undefined, selected: undefined === selectedColor }, ['unset']));
        return elements;
    }
    formColorDropDownOptions(selectedColor) {
        return linkDidactorSettings.linkColorOptions.map(color => (0, RenderElement_1.createElement)('option', { value: color, selected: color === selectedColor }, [color]));
    }
    async setDefaultLinkMode(mode) {
        if (mode && !LinkAppearanceData_1.linkAppearanceModes.includes(mode)) {
            util_1.util.logWarning(`default LinkTagMode '${mode}' is not known.`);
        }
        await linkDidactorSettings.setDefaultLinkAppereanceModeAndSave(mode);
        await this.rerenderLinks();
    }
    async setLinkTagMode(tag, mode) {
        if (mode && !LinkAppearanceData_1.linkAppearanceModes.includes(mode)) {
            util_1.util.logWarning(`LinkTagMode '${mode}' is not known.`);
        }
        tag.appearance.mode = mode;
        await linkDidactorSettings.saveToFileSystem();
        await this.rerenderLinks();
    }
    async setDefaultLinkColor(color) {
        await linkDidactorSettings.setDefaultLinkAppereanceColorAndSave(color);
        await this.rerenderLinks();
    }
    async setLinkTagColor(tag, color) {
        tag.appearance.color = color;
        await linkDidactorSettings.saveToFileSystem();
        await this.rerenderLinks();
    }
    async rerenderLinks() {
        const links = pluginFacade.getRootFolder().getInnerLinksRecursive().map(boxLinks => boxLinks.getLinks()).flat();
        await Promise.all(links.map(link => link.render()));
    }
}
exports.LinkDidactorToolbarViewWidget = LinkDidactorToolbarViewWidget;
