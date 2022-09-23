"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkDidactorToolbarViewWidget = void 0;
const RenderManager_1 = require("../../../dist/RenderManager");
const Widget_1 = require("../../../dist/Widget");
const DidactedLinkTag_1 = require("../DidactedLinkTag");
const linkDidactorSettings = require("../linkDidactorSettings");
const pluginFacade_1 = require("../../../dist/pluginFacade");
const util_1 = require("../../../dist/util");
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
        await RenderManager_1.renderManager.setContentTo(this.getId(), this.formHtml());
        await this.addEventListeners();
    }
    formHtml() {
        const tagsOrMessage = linkDidactorSettings.getLinkTags();
        if (tagsOrMessage instanceof pluginFacade_1.Message) {
            this.renderedLinkTags = [];
            return tagsOrMessage.message;
        }
        this.renderedLinkTags = tagsOrMessage;
        return tagsOrMessage.map(tag => this.formHtmlLineFor(tag)).join('');
    }
    formHtmlLineFor(tag) {
        return `<div>${tag.getName()}(${tag.getCount()}): ${this.formHtmlDropDown(tag)}</div>`;
    }
    formHtmlDropDown(tag) {
        let options = '';
        for (let mode of DidactedLinkTag_1.linkTagModes) {
            const selected = mode === tag.getMode() ? 'selected' : '';
            options += `<option value="${mode}" ${selected}>${mode}</option>`;
        }
        return `<select id="${this.getTagModeDropModeId(tag)}">${options}</select>`;
    }
    async addEventListeners() {
        await Promise.all(this.renderedLinkTags.map(tag => this.addEventListenerForTag(tag)));
    }
    async addEventListenerForTag(tag) {
        await RenderManager_1.renderManager.addChangeListenerTo(this.getTagModeDropModeId(tag), 'value', (value) => this.setLinkTagMode(tag, value));
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
