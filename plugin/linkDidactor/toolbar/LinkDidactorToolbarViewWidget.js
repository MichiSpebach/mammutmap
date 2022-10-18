"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkDidactorToolbarViewWidget = void 0;
const RenderManager_1 = require("../../../dist/RenderManager");
const Widget_1 = require("../../../dist/Widget");
const DidactedLinkTag_1 = require("../DidactedLinkTag");
const linkDidactorSettings = require("../linkDidactorSettings");
const pluginFacade = require("../../../dist/pluginFacade");
const pluginFacade_1 = require("../../../dist/pluginFacade");
const util_1 = require("../../../dist/util");
const RenderElement_1 = require("../../../dist/util/RenderElement");
// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
class LinkDidactorToolbarViewWidget extends Widget_1.Widget {
    constructor(id) {
        super();
        this.id = id;
        this.renderedOrInProgress = false;
        this.renderedLinkTags = [];
    }
    getId() {
        return this.id;
    }
    getDefaultModeDropDownId() {
        return this.getId() + '-default';
    }
    getTagModeDropDownId(tag) {
        return this.getId() + tag.getName();
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
            this.renderedLinkTags = []
        ]);
    }
    async clearEventListeners() {
        await Promise.all(this.renderedLinkTags.map(tag => RenderManager_1.renderManager.removeEventListenerFrom(this.getTagModeDropDownId(tag), 'change')));
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
            this.renderedLinkTags = [];
            return tagsOrMessage.message;
        }
        this.renderedLinkTags = tagsOrMessage;
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
        const label = `${tag.getName()}(${tag.getCount()}): `;
        const dropDown = this.formTagModeDropDown(tag);
        return (0, RenderElement_1.ce)('tr', {}, [
            (0, RenderElement_1.ce)('td', {}, [label]),
            (0, RenderElement_1.ce)('td', {}, [dropDown])
        ]);
    }
    formDefaultModeDropDown() {
        return (0, RenderElement_1.createElement)('select', {
            id: this.getDefaultModeDropDownId(),
            onchangeValue: (value) => this.setDefaultLinkMode(value)
        }, this.formDropDownOptions(linkDidactorSettings.getDefaultLinkMode()));
    }
    formTagModeDropDown(tag) {
        return (0, RenderElement_1.createElement)('select', {
            id: this.getTagModeDropDownId(tag),
            onchangeValue: (value) => this.setLinkTagMode(tag, value)
        }, this.formDropDownOptions(tag.getMode()));
    }
    formDropDownOptions(tagMode) {
        return DidactedLinkTag_1.linkTagModes.map(mode => (0, RenderElement_1.createElement)('option', { value: mode, selected: mode === tagMode }, [mode]));
    }
    async setDefaultLinkMode(mode) {
        if (!DidactedLinkTag_1.linkTagModes.includes(mode)) {
            util_1.util.logWarning(`default LinkTagMode '${mode}' is not known.`);
        }
        await linkDidactorSettings.setDefaultLinkModeAndSaveToFileSystem(mode);
    }
    async setLinkTagMode(tag, mode) {
        if (!DidactedLinkTag_1.linkTagModes.includes(mode)) {
            util_1.util.logWarning(`LinkTagMode '${mode}' is not known.`);
        }
        tag.setMode(mode);
        await linkDidactorSettings.saveToFileSystem();
    }
}
exports.LinkDidactorToolbarViewWidget = LinkDidactorToolbarViewWidget;
