"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidactedLinkTagData = void 0;
const LinkTagData_1 = require("../../dist/mapData/LinkTagData");
class DidactedLinkTagData extends LinkTagData_1.LinkTagData {
    constructor(name, count, mode) {
        super(name, count);
        this.mode = mode;
    }
    getMode() {
        if (!this.mode) {
            return 'visible';
        }
        return this.mode;
    }
    setMode(mode) {
        if (mode === 'visible') {
            this.mode = undefined;
        }
        else {
            this.mode = mode;
        }
    }
}
exports.DidactedLinkTagData = DidactedLinkTagData;
