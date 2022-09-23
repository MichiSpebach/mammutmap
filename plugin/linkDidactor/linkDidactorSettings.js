"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLinkTags = exports.getComputedModeForLinkTag = exports.linkTagSubscribers = void 0;
const pluginFacade = require("../../dist/pluginFacade");
const pluginFacade_1 = require("../../dist/pluginFacade");
const util_1 = require("../../dist/util");
const DidactedLinkTag_1 = require("./DidactedLinkTag");
exports.linkTagSubscribers = new pluginFacade_1.Subscribers();
(0, pluginFacade_1.subscribeMap)(onMapLoaded, onMapUnloaded);
function onMapLoaded(map) {
    map.getProjectSettings().linkTagSubscribers.subscribe(() => exports.linkTagSubscribers.call(getLinkTags()));
    exports.linkTagSubscribers.call(getLinkTags());
}
function onMapUnloaded() {
    exports.linkTagSubscribers.call(getLinkTags());
}
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
    return getLinkTagsOrWarn().find(tag => tag.getName() === tagName);
}
function getLinkTagsOrWarn() {
    const tagsOrMessage = getLinkTags();
    if (tagsOrMessage instanceof pluginFacade_1.Message) {
        util_1.util.logWarning('Failed to getLinkTagsOrWarn(), returning empty list. Reason: ' + tagsOrMessage.message);
        return [];
    }
    return tagsOrMessage;
}
function getLinkTags() {
    const mapOrMessage = pluginFacade.getMap();
    if (mapOrMessage instanceof pluginFacade_1.Message) {
        return mapOrMessage;
    }
    return mapOrMessage.getProjectSettings().getLinkTags().map(tagData => new DidactedLinkTag_1.DidactedLinkTag(tagData));
}
exports.getLinkTags = getLinkTags;
