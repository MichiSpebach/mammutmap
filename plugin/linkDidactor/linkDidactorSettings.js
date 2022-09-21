"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkTags = exports.getComputedModeForLinkTag = void 0;
const pluginFacade = require("../../dist/pluginFacade");
const util_1 = require("../../dist/util");
const DidactedLinkTag_1 = require("./DidactedLinkTag");
function getComputedModeForLinkTag(tagName) {
    const tag = findLinkTagByName(tagName);
    if (!tag) {
        util_1.util.logWarning('cannot getComputedModeForLinkTag because no LinkTag with name ' + tagName + ' found, returning visible as default');
        return 'visible';
    }
    return tag.getMode();
}
exports.getComputedModeForLinkTag = getComputedModeForLinkTag;
function findLinkTagByName(tagName) {
    return getLinkTags().find(tag => tag.getName() === tagName);
}
function getLinkTags() {
    return pluginFacade.getMap().getProjectSettings().getLinkTags().map(tagData => new DidactedLinkTag_1.DidactedLinkTag(tagData));
}
exports.getLinkTags = getLinkTags;
