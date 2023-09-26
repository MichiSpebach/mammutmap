"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkAppearanceData = exports.linkAppearanceModes = void 0;
const JsonObject_1 = require("../JsonObject");
const util_1 = require("../util/util");
exports.linkAppearanceModes = ['notRendered', 'hidden', 'visibleEnds', 'visible']; // "as const" makes LinkAppearanceMode a typesafe union of literals
class LinkAppearanceData extends JsonObject_1.JsonObject {
    static ofRawObject(object) {
        const data = Object.setPrototypeOf(object, LinkAppearanceData.prototype);
        data.validate();
        return data;
    }
    constructor(mode, color) {
        super();
        this.mode = mode;
        this.color = color;
        this.validate();
    }
    validate() {
        if (this.mode && !exports.linkAppearanceModes.includes(this.mode)) {
            util_1.util.logWarning('mode ' + this.mode + ' is not known');
        }
    }
}
exports.LinkAppearanceData = LinkAppearanceData;
