"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextInputPopup = void 0;
const PopupWidget_1 = require("./PopupWidget");
const RenderManager_1 = require("./RenderManager");
const util_1 = require("./util/util");
class TextInputPopup extends PopupWidget_1.PopupWidget {
    static async buildAndRenderAndAwaitResolve(title, defaultValue) {
        let resolvePromise;
        const promise = new Promise((resolve) => {
            resolvePromise = resolve;
        });
        const popup = new TextInputPopup(title, defaultValue, (text) => resolvePromise(text));
        await popup.render();
        return promise;
    }
    constructor(title, defaultValue, resolve) {
        super('textInputPopup' + util_1.util.generateId(), title, () => resolve(undefined));
        this.defaultValue = defaultValue;
        this.resolve = resolve;
    }
    formContent() {
        let html = `<form id="${this.getId() + 'Form'}" onsubmit="return false">`; // onsubmit="return false" prevents action from trying to call an url
        html += `<input onfocus="this.select()" id="${this.getId() + 'Input'}" value="${this.defaultValue}" autofocus>`; // TODO: autofocus only works once
        html += `<button id="${this.getId() + 'Ok'}">ok</button>`;
        html += '</form>';
        return html;
    }
    async afterRender() {
        await RenderManager_1.renderManager.addEventListenerTo(this.getId() + 'Ok', 'click', async () => {
            const value = await RenderManager_1.renderManager.getValueOf(this.getId() + 'Input');
            this.resolve(value);
            this.unrender();
        });
    }
    async beforeUnrender() {
        await RenderManager_1.renderManager.removeEventListenerFrom(this.getId() + 'Ok', 'click');
    }
}
exports.TextInputPopup = TextInputPopup;
