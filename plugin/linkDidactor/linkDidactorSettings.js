"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveToFileSystem = exports.getLinkTags = exports.getComputedModeForLinkTag = exports.linkTags = void 0;
const pluginFacade = require("../../dist/pluginFacade");
const pluginFacade_1 = require("../../dist/pluginFacade");
const util_1 = require("../../dist/util");
const DidactedLinkTag_1 = require("./DidactedLinkTag");
exports.linkTags = new pluginFacade_1.Subscribers();
pluginFacade_1.onMapLoaded.subscribe((map) => {
    map.getProjectSettings().linkTags.subscribe(() => exports.linkTags.callSubscribers(getLinkTags()));
    exports.linkTags.callSubscribers(getLinkTags());
});
pluginFacade_1.onMapUnload.subscribe(() => exports.linkTags.callSubscribers(getLinkTags()));
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
async function saveToFileSystem() {
    const mapOrMessage = pluginFacade.getMap();
    if (mapOrMessage instanceof pluginFacade_1.Message) {
        return util_1.util.logWarning('Failed to saveToFileSystem, reason: ' + mapOrMessage.message);
    }
    await mapOrMessage.getProjectSettings().saveToFileSystem();
}
exports.saveToFileSystem = saveToFileSystem;
