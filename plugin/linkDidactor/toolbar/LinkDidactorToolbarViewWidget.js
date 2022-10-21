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
        return this.getId() + '-default';
    }
    getTagModeDropDownId(tag) {
        return this.getId() + tag.name;
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
        const dropDown = this.formDefaultModeDropDown();
        return (0, RenderElement_1.ce)('tr', {}, [
            (0, RenderElement_1.ce)('td', {}, [label]),
            (0, RenderElement_1.ce)('td', {}, [dropDown])
        ]);
    }
    formTagRow(tag) {
        const label = `${tag.name}(${tag.count}): `;
        const dropDown = this.formTagModeDropDown(tag);
        return (0, RenderElement_1.ce)('tr', {}, [
            (0, RenderElement_1.ce)('td', {}, [label]),
            (0, RenderElement_1.ce)('td', {}, [dropDown])
        ]);
    }
    formDefaultModeDropDown() {
        const elementId = this.getDefaultModeDropDownId();
        this.elementIdsWithChangeEventListeners.push(elementId);
        return (0, RenderElement_1.createElement)('select', {
            id: elementId,
            onchangeValue: (value) => this.setDefaultLinkMode(value)
        }, this.formDropDownOptions(linkDidactorSettings.getDefaultLinkAppereance().getMode()));
    }
    formTagModeDropDown(tag) {
        const elementId = this.getTagModeDropDownId(tag);
        this.elementIdsWithChangeEventListeners.push(elementId);
        return (0, RenderElement_1.createElement)('select', {
            id: elementId,
            onchangeValue: (value) => this.setLinkTagMode(tag, value)
        }, this.formDropDownOptions(tag.appearance.getMode()));
    }
    formDropDownOptions(tagMode) {
        return LinkAppearanceData_1.linkAppearanceModes.map(mode => (0, RenderElement_1.createElement)('option', { value: mode, selected: mode === tagMode }, [mode]));
    }
    async setDefaultLinkMode(mode) {
        if (!LinkAppearanceData_1.linkAppearanceModes.includes(mode)) {
            util_1.util.logWarning(`default LinkTagMode '${mode}' is not known.`);
        }
        linkDidactorSettings.getDefaultLinkAppereance().setMode(mode);
        await linkDidactorSettings.saveToFileSystem();
        await this.rerenderLinks();
    }
    async setLinkTagMode(tag, mode) {
        if (!LinkAppearanceData_1.linkAppearanceModes.includes(mode)) {
            util_1.util.logWarning(`LinkTagMode '${mode}' is not known.`);
        }
        tag.appearance.setMode(mode);
        await linkDidactorSettings.saveToFileSystem();
        await this.rerenderLinks();
    }
    async rerenderLinks() {
        const links = pluginFacade.getRootFolder().getInnerLinksRecursive().map(boxLinks => boxLinks.getLinks()).flat();
        await Promise.all(links.map(link => link.render()));
    }
}
exports.LinkDidactorToolbarViewWidget = LinkDidactorToolbarViewWidget;
