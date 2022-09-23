"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkDidactorToolbarViewWidget = void 0;
const RenderManager_1 = require("../../../dist/RenderManager");
const Widget_1 = require("../../../dist/Widget");
const linkDidactorSettings = require("../linkDidactorSettings");
const pluginFacade_1 = require("../../../dist/pluginFacade");
// TODO: extend from SimpleWidget that does not need to know renderManager and only contains formHtml()
class LinkDidactorToolbarViewWidget extends Widget_1.Widget {
    constructor(id) {
        super();
        this.id = id;
        this.shouldBeRendered = false;
    }
    getId() {
        return this.id;
    }
    async render() {
        if (!this.shouldBeRendered) {
            linkDidactorSettings.linkTagSubscribers.subscribe(() => this.render());
        }
        this.shouldBeRendered = true;
        await RenderManager_1.renderManager.setContentTo(this.getId(), this.formHtml());
    }
    formHtml() {
        const tagsOrMessage = linkDidactorSettings.getLinkTags();
        if (tagsOrMessage instanceof pluginFacade_1.Message) {
            return tagsOrMessage.message;
        }
        return tagsOrMessage.map(tag => this.formHtmlLineFor(tag)).join('');
    }
    formHtmlLineFor(tag) {
        return `<div>${tag.getName()}: ${tag.getMode()}</div>`;
    }
}
exports.LinkDidactorToolbarViewWidget = LinkDidactorToolbarViewWidget;
