"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkDidactorToolbarViewWidget = void 0;
const RenderManager_1 = require("../../../dist/RenderManager");
const Widget_1 = require("../../../dist/Widget");
const DidactedLinkTag_1 = require("../DidactedLinkTag");
const linkDidactorSettings = require("../linkDidactorSettings");
const pluginFacade_1 = require("../../../dist/pluginFacade");
const util_1 = require("../../../dist/util");
const RenderElement_1 = require("../../../dist/util/RenderElement");
// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
class LinkDidactorToolbarViewWidget extends Widget_1.Widget {
    constructor(id) {
        super();
        this.id = id;
        this.shouldBeRendered = false;
        this.renderedLinkTags = [];
    }
    getId() {
        return this.id;
    }
    getTagModeDropModeId(tag) {
        return this.getId() + tag.getName();
    }
    async render() {
        if (!this.shouldBeRendered) {
            linkDidactorSettings.linkTags.subscribe(() => this.render());
        }
        this.shouldBeRendered = true;
        await this.clearEventListeners();
        await RenderManager_1.renderManager.setElementsTo(this.getId(), this.form());
    }
    async clearEventListeners() {
        await Promise.all(this.renderedLinkTags.map(tag => RenderManager_1.renderManager.removeEventListenerFrom(this.getTagModeDropModeId(tag), 'change')));
    }
    form() {
        const tagsOrMessage = linkDidactorSettings.getLinkTags();
        if (tagsOrMessage instanceof pluginFacade_1.Message) {
            this.renderedLinkTags = [];
            return tagsOrMessage.message;
        }
        this.renderedLinkTags = tagsOrMessage;
        const tagElements = tagsOrMessage.map(tag => this.formLineFor(tag));
        return tagElements;
    }
    formLineFor(tag) {
        const label = `${tag.getName()}(${tag.getCount()}): `;
        const dropDown = this.formDropDown(tag);
        return (0, RenderElement_1.createElement)('div', {}, [label, dropDown]);
    }
    formDropDown(tag) {
        const options = DidactedLinkTag_1.linkTagModes.map(mode => {
            return (0, RenderElement_1.createElement)('option', { value: mode, selected: mode === tag.getMode() }, [mode]);
        });
        return (0, RenderElement_1.createElement)('select', {
            id: this.getTagModeDropModeId(tag),
            onchangeValue: (value) => this.setLinkTagMode(tag, value)
        }, options);
    }
    async setLinkTagMode(tag, mode) {
        if (!DidactedLinkTag_1.linkTagModes.includes(mode)) {
            util_1.util.logWarning(`LinkTagMode ${mode} is not known.`);
        }
        tag.setMode(mode);
        await linkDidactorSettings.saveToFileSystem();
    }
}
exports.LinkDidactorToolbarViewWidget = LinkDidactorToolbarViewWidget;
