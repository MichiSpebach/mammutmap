"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidactedLinkTag = exports.linkTagModes = void 0;
const util_1 = require("../../dist/util");
exports.linkTagModes = ['notRendered', 'visibleEnds', 'visible']; // "as const" makes LinkTagMode a typesafe union of literals
class DidactedLinkTag {
    constructor(data) {
        this.data = data;
        this.validateMode();
    }
    validateMode() {
        const mode = this.data.mode;
        if (mode && !exports.linkTagModes.includes(mode)) {
            util_1.util.logWarning('mode ' + mode + ' is not known');
        }
    }
    getName() {
        return this.data.name;
    }
    getCount() {
        return this.data.count;
    }
    getMode() {
        if (!this.data.mode) {
            return 'visible';
        }
        return this.data.mode;
    }
    setMode(mode) {
        if (mode === 'visible') {
            this.data.mode = undefined;
        }
        else {
            this.data.mode = mode;
        }
    }
}
exports.DidactedLinkTag = DidactedLinkTag;
