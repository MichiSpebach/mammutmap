"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleWidget = exports.Widget = void 0;
const RenderManager_1 = require("./RenderManager");
// TODO move into util folder
// TODO rename to RenderingWidget and introduce (Simple)Widget with formHtml() method that does not need to know renderManager
// TODO all gui components should inherit this (Box, BoxHeader, BoxBody, Link, LinkEnd, ...)
class Widget {
}
exports.Widget = Widget;
class SimpleWidget extends Widget {
    async render() {
        await RenderManager_1.renderManager.setElementsTo(this.getId(), await this.shapeFormInner());
    }
    async unrender() {
        await RenderManager_1.renderManager.clearContentOf(this.getId());
    }
}
exports.SimpleWidget = SimpleWidget;
