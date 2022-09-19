"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkDidactorToolbarView = void 0;
const util_1 = require("../../../dist/util");
const LinkDidactorToolbarViewWidget_1 = require("./LinkDidactorToolbarViewWidget");
class LinkDidactorToolbarView {
    constructor(name) {
        this.name = name;
        this.widget = new LinkDidactorToolbarViewWidget_1.LinkDidactorToolbarViewWidget(name + util_1.util.generateId());
    }
    getName() {
        return this.name;
    }
    getWidget() {
        return this.widget;
    }
}
exports.LinkDidactorToolbarView = LinkDidactorToolbarView;
