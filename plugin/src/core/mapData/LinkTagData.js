"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkTagData = void 0;
const util_1 = require("../util/util");
const LinkAppearanceData_1 = require("./LinkAppearanceData");
const TagData_1 = require("./TagData");
class LinkTagData extends TagData_1.TagData {
    static ofRawObject(object) {
        const linkTagData = Object.setPrototypeOf(object, LinkTagData.prototype);
        if (linkTagData.appearance) {
            linkTagData.appearance = LinkAppearanceData_1.LinkAppearanceData.ofRawObject(linkTagData.appearance); // raw object would have no methods
        }
        else {
            linkTagData.appearance = new LinkAppearanceData_1.LinkAppearanceData();
        }
        linkTagData.validate();
        return linkTagData;
    }
    constructor(name, count, appearance) {
        super(name, count);
        if (appearance) {
            this.appearance = appearance;
        }
        else {
            this.appearance = new LinkAppearanceData_1.LinkAppearanceData();
        }
        this.validate();
    }
    validate() {
        if (!this.name) {
            util_1.util.logWarning('LinkTagData::name is undefined or null.');
        }
        if (!this.count) {
            util_1.util.logWarning('LinkTagData::count is undefined or null.');
        }
        if (!this.appearance) {
            util_1.util.logWarning('LinkTagData::appearance is undefined or null.');
        }
    }
}
exports.LinkTagData = LinkTagData;
LinkTagData.defaultTagNames = [
    'hidden',
    'isA',
    'has',
    'important',
    'falsePositive', // TODO: add description "wrongly recognized by plugin"
];
