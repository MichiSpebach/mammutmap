"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopupWidget = void 0;
const indexHtmlIds = require("./indexHtmlIds");
const RenderManager_1 = require("./RenderManager");
const styleAdapter_1 = require("./styleAdapter");
const util_1 = require("./util/util");
const Widget_1 = require("./Widget");
class PopupWidget extends Widget_1.Widget {
    static async buildAndRender(title, content, onClose) {
        await this.newAndRender({ title, content, onClose });
    }
    static async newAndRender(options) {
        const widget = new class extends PopupWidget {
            constructor() {
                super(options.title + util_1.util.generateId(), options.title, options.onClose);
            }
            formContent() {
                return options.content;
            }
        };
        await widget.render();
        return widget;
    }
    constructor(id, title, onClose) {
        super();
        this.id = id;
        this.title = title;
        this.onClose = onClose;
    }
    getId() {
        return this.id;
    }
    async render() {
        const closeButton = {
            type: 'button',
            id: this.id + 'Close',
            style: { float: 'right' },
            onclick: () => {
                if (this.onClose) {
                    this.onClose();
                }
                this.unrender();
            },
            children: 'X'
        };
        const header = {
            type: 'div',
            style: { marginBottom: '5px' },
            children: [this.title, closeButton]
        };
        let content = this.formContent();
        if (typeof content === 'string') { // in order to keep old PopupWidgets work, would not be interpreted as html otherwise
            content = {
                type: 'div',
                innerHTML: content
            };
        }
        const body = {
            type: 'div',
            style: {
                maxWidth: '90vw',
                maxHeight: '85vh',
                overflow: 'auto'
            },
            children: content
        };
        await RenderManager_1.renderManager.addElementTo(indexHtmlIds.bodyId, {
            type: 'div',
            id: this.id,
            className: styleAdapter_1.style.getPopupClass(),
            children: [header, body].flat()
        });
        await this.afterRender();
    }
    // TODO: remove and simply override render() instead
    async afterRender() { }
    // TODO: remove and simply override render() instead
    async beforeUnrender() { }
    async unrender() {
        await this.beforeUnrender();
        await RenderManager_1.renderManager.remove(this.id);
    }
}
exports.PopupWidget = PopupWidget;
