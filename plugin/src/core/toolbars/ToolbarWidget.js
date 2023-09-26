"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolbarWidget = void 0;
const RenderManager_1 = require("../RenderManager");
const Widget_1 = require("../Widget");
class ToolbarWidget extends Widget_1.Widget {
    constructor(id) {
        super();
        this.views = [];
        this.shouldBeRendered = false;
        this.id = id;
    }
    getId() {
        return this.id;
    }
    async addView(view) {
        this.views.push(view);
        if (!this.selectedView) {
            this.selectedView = this.views[0];
        }
        if (this.shouldBeRendered) {
            await this.render();
        }
    }
    async render() {
        this.shouldBeRendered = true;
        if (this.views.length === 0) {
            await RenderManager_1.renderManager.setContentTo(this.getId(), 'no ToolbarViews added');
            return;
        }
        if (!this.selectedView) {
            await RenderManager_1.renderManager.setContentTo(this.getId(), 'no ToolbarView selected');
            return;
        }
        let html = this.formHeaderHtml();
        html += `<div id="${this.selectedView.getWidget().getId()}"></div>`;
        await RenderManager_1.renderManager.setContentTo(this.getId(), html);
        await this.selectedView.getWidget().render();
    }
    async unrender() {
        this.shouldBeRendered = false;
        if (this.selectedView) {
            await this.selectedView.getWidget().unrender();
        }
        await RenderManager_1.renderManager.setContentTo(this.getId(), '');
    }
    formHeaderHtml() {
        let html = '';
        for (const view of this.views) {
            if (view === this.selectedView) {
                html += `<span><b>${view.getName()}</b></span>`;
            }
            else {
                html += `<span>${view.getName()}</span>`;
            }
        }
        return html;
    }
}
exports.ToolbarWidget = ToolbarWidget;
