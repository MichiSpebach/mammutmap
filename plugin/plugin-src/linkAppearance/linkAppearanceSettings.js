"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveToFileSystem = exports.getLinkTags = exports.setDefaultLinkAppereanceColorAndSave = exports.setDefaultLinkAppereanceModeAndSave = exports.getDefaultLinkAppereanceColor = exports.getDefaultLinkAppereanceMode = exports.getComputedColorForLinkTags = exports.getComputedModeForLinkTags = exports.linkTags = exports.linkColorOptions = exports.boxIdHashColorName = exports.linkColors = void 0;
const pluginFacade = require("../../dist/pluginFacade");
const pluginFacade_1 = require("../../dist/pluginFacade");
const pluginFacade_2 = require("../../dist/pluginFacade");
const pluginFacade_3 = require("../../dist/pluginFacade");
exports.linkColors = ['red', 'green', 'blue', 'yellow', 'orange', 'magenta', 'aqua', 'lime', 'purple', 'teal', pluginFacade_3.style.getLinkColor()];
exports.boxIdHashColorName = 'boxId hash';
exports.linkColorOptions = [...exports.linkColors, exports.boxIdHashColorName];
exports.linkTags = new pluginFacade_1.Subscribers();
pluginFacade_1.onMapLoaded.subscribe(async (map) => {
    map.getProjectSettings().linkTags.subscribe(() => exports.linkTags.callSubscribers(getLinkTags()));
    await exports.linkTags.callSubscribers(getLinkTags());
});
pluginFacade_1.onMapUnload.subscribe(() => exports.linkTags.callSubscribers(getLinkTags()));
function getComputedModeForLinkTags(tagNames) {
    let mostImportantMode = getDefaultLinkAppereanceMode();
    if (!tagNames || tagNames.length === 0) {
        return mostImportantMode;
    }
    for (const linkTag of getLinkTagsSortedByIndex(tagNames)) {
        if (linkTag.appearance.mode) {
            mostImportantMode = linkTag.appearance.mode;
        }
    }
    return mostImportantMode;
}
exports.getComputedModeForLinkTags = getComputedModeForLinkTags;
function getComputedColorForLinkTags(tagNames) {
    let mostImportantColor = getDefaultLinkAppereanceColor();
    if (!tagNames || tagNames.length === 0) {
        return mostImportantColor;
    }
    for (const linkTag of getLinkTagsSortedByIndex(tagNames)) {
        if (linkTag.appearance.color) {
            mostImportantColor = linkTag.appearance.color;
        }
    }
    return mostImportantColor;
}
exports.getComputedColorForLinkTags = getComputedColorForLinkTags;
function getLinkTagsSortedByIndex(tagNames) {
    return getLinkTagsOrWarn().filter(tag => tagNames.includes(tag.name));
}
function getLinkTagsOrWarn() {
    const tagsOrMessage = getLinkTags();
    if (tagsOrMessage instanceof pluginFacade_1.Message) {
        pluginFacade_2.coreUtil.logWarning('Failed to getLinkTagsOrWarn(), returning empty list. Reason: ' + tagsOrMessage.message);
        return [];
    }
    return tagsOrMessage;
}
function getDefaultLinkAppereanceMode() {
    return getDefaultLinkAppereance().mode ?? 'visible';
}
exports.getDefaultLinkAppereanceMode = getDefaultLinkAppereanceMode;
function getDefaultLinkAppereanceColor() {
    return getDefaultLinkAppereance().color ?? pluginFacade_3.style.getLinkColor();
}
exports.getDefaultLinkAppereanceColor = getDefaultLinkAppereanceColor;
function getDefaultLinkAppereance() {
    return pluginFacade.getMapOrError().getProjectSettings().getDefaultLinkAppearance();
}
async function setDefaultLinkAppereanceModeAndSave(mode) {
    getDefaultLinkAppereance().mode = mode;
    await saveToFileSystem();
}
exports.setDefaultLinkAppereanceModeAndSave = setDefaultLinkAppereanceModeAndSave;
async function setDefaultLinkAppereanceColorAndSave(color) {
    getDefaultLinkAppereance().color = color;
    await saveToFileSystem();
}
exports.setDefaultLinkAppereanceColorAndSave = setDefaultLinkAppereanceColorAndSave;
function getLinkTags() {
    const mapOrMessage = pluginFacade.getMap();
    if (mapOrMessage instanceof pluginFacade_1.Message) {
        return mapOrMessage;
    }
    return mapOrMessage.getProjectSettings().getLinkTags();
}
exports.getLinkTags = getLinkTags;
async function saveToFileSystem() {
    const mapOrMessage = pluginFacade.getMap();
    if (mapOrMessage instanceof pluginFacade_1.Message) {
        return pluginFacade_2.coreUtil.logWarning('Failed to saveToFileSystem, reason: ' + mapOrMessage.message);
    }
    await mapOrMessage.getProjectSettings().saveToFileSystem();
}
exports.saveToFileSystem = saveToFileSystem;
