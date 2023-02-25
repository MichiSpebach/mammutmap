"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkDidactorToolbarView = void 0;
const pluginFacade_1 = require("../../../dist/pluginFacade");
const LinkDidactorToolbarViewWidget_1 = require("./LinkDidactorToolbarViewWidget");
class LinkDidactorToolbarView {
    constructor(name) {
        this.name = name;
        this.widget = new LinkDidactorToolbarViewWidget_1.LinkDidactorToolbarViewWidget(name + pluginFacade_1.coreUtil.generateId());
    }
    getName() {
        return this.name;
    }
    getWidget() {
        return this.widget;
    }
}
exports.LinkDidactorToolbarView = LinkDidactorToolbarView;
