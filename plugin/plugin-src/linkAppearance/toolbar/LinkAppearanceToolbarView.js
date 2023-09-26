"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkAppearanceToolbarView = void 0;
const pluginFacade_1 = require("../../../dist/pluginFacade");
const LinkAppearanceToolbarViewWidget_1 = require("./LinkAppearanceToolbarViewWidget");
class LinkAppearanceToolbarView {
    constructor(name) {
        this.name = name;
        this.widget = new LinkAppearanceToolbarViewWidget_1.LinkAppearanceToolbarViewWidget(name + pluginFacade_1.coreUtil.generateId());
    }
    getName() {
        return this.name;
    }
    getWidget() {
        return this.widget;
    }
}
exports.LinkAppearanceToolbarView = LinkAppearanceToolbarView;
