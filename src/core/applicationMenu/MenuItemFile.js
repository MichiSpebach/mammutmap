"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemFile = void 0;
const MenuItem_1 = require("./MenuItem");
class MenuItemFile extends MenuItem_1.MenuItem {
    //public readonly stayOpenWhenClicked: boolean TODO: for toggles e.g. linkTags this option would be convenient
    constructor(params) {
        super(params);
        this.click = params.click;
    }
}
exports.MenuItemFile = MenuItemFile;
