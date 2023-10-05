"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuItem = void 0;
const util_1 = require("../util/util");
class MenuItem {
    constructor(params) {
        if (params.id) {
            this.id = params.id;
        }
        else {
            this.id = params.label + util_1.util.generateId();
        }
        this.label = params.label;
        if (params.enabled === undefined) {
            this.enabled = true;
        }
        else {
            this.enabled = params.enabled;
        }
    }
}
exports.MenuItem = MenuItem;
