"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItemFolder = void 0;
const MenuItem_1 = require("./MenuItem");
class MenuItemFolder extends MenuItem_1.MenuItem {
    constructor(options) {
        super(options);
        this.preferredOpenDirection = options.preferredOpenDirection ?? 'right';
        this.submenu = options.submenu;
    }
    findMenuItemById(id) {
        let matchingItem = this.submenu.find(item => item.id === id);
        for (const item of this.submenu) {
            if (matchingItem) {
                break;
            }
            if (item instanceof MenuItemFolder) {
                matchingItem = item.findMenuItemById(id);
            }
        }
        return matchingItem;
    }
}
exports.MenuItemFolder = MenuItemFolder;
