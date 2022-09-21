"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidactedLinkTag = void 0;
const util_1 = require("../../dist/util");
const linkTagModes = ['notDisplayed', 'visibleEnds', 'visible']; // "as const" makes LinkTagMode a typesafe union of literals
class DidactedLinkTag {
    constructor(data) {
        this.data = data;
        this.validateMode();
    }
    validateMode() {
        const mode = this.data.mode;
        if (mode && !(mode in linkTagModes)) {
            util_1.util.logWarning('mode ' + mode + ' is not known');
        }
    }
    getName() {
        return this.data.name;
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
