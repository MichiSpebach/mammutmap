"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.style = exports.setCompatibilityTheme = void 0;
const indexHtmlIds = require("./indexHtmlIds");
const RenderManager_1 = require("./RenderManager");
class DarkTheme {
    getClass(name) {
        return name;
    }
    getApplicationMenuClass(suffix) {
        return 'applicationMenu' + suffix;
    }
    getHintClass() {
        return 'hint';
    }
    getPopupClass() {
        return 'popup';
    }
    getFileBoxBackgroundClass() {
        return 'fileBoxBackground';
    }
    getFolderBoxBackgroundClass() {
        return 'folderBoxBackground';
    }
    getSourcelessBoxBackgroundClass() {
        return 'sourcelessBoxBackground';
    }
    getBoxBorderClass() {
        return 'boxBorder';
    }
    getAdditionalBoxBorderClass(mapDataFileExisting) {
        if (mapDataFileExisting) {
            return 'boxBorderWithMapData';
        }
        else {
            return 'boxBorderWithoutMapData';
        }
    }
    getBoxHeaderInnerClass() {
        return 'boxHeaderInner';
    }
    getFileBoxHeaderInnerClass() {
        return 'fileBoxHeaderInner';
    }
    getFolderBoxHeaderInnerClass() {
        return 'folderBoxHeaderInner';
    }
    getSourcelessBoxHeaderInnerClass() {
        return 'sourcelessBoxHeaderInner';
    }
    getBoxBodyZoomInToRenderHintClass() {
        return 'boxBodyZoomInToRenderHint';
    }
    getBoxBodyZoomInToRenderHintTextClass() {
        return 'boxBodyZoomInToRenderHintText';
    }
    getFileBoxBodyTextClass() {
        return 'fileBoxBodyText';
    }
    getHorizontalResizeClass() {
        return 'ewResize';
    }
    getVerticalResizeClass() {
        return 'nsResize';
    }
    getDiagonalResizeClass() {
        return 'nwseResize';
    }
    getHighlightTransitionClass() {
        return 'highlightTransition';
    }
    getHighlightClass() {
        return 'highlight';
    }
    getHighlightLinkClass() {
        return 'highlightLink';
    }
    getLinkColor() {
        return '#2060c0';
    }
}
class CompatibilityTheme extends DarkTheme {
    static async new() {
        let additionalStyleSheets = '<link href="../../node_modules/@fontsource/source-sans-pro/400.css" rel="stylesheet" type="text/css">';
        additionalStyleSheets += '<link href="../../node_modules/@fontsource/source-code-pro/400.css" rel="stylesheet" type="text/css">';
        additionalStyleSheets += '<link href="../core/indexCompatibilityTheme.css" rel="stylesheet" type="text/css">';
        await RenderManager_1.renderManager.addContentTo(indexHtmlIds.headId, additionalStyleSheets);
        return new CompatibilityTheme();
    }
    getHighlightTransitionClass() {
        return '';
    }
}
async function setCompatibilityTheme() {
    exports.style = await CompatibilityTheme.new();
}
exports.setCompatibilityTheme = setCompatibilityTheme;
exports.style = new DarkTheme();
