"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const applicationMenu = require("../dist/applicationMenu");
const electron_1 = require("electron");
const util_1 = require("../dist/util");
const domAdapter_1 = require("../dist/domAdapter");
const styleAdapter_1 = require("../dist/styleAdapter");
const deactivateMenuItem = new electron_1.MenuItem({ label: 'deactivate', click: deactivate });
const activateMenuItem = new electron_1.MenuItem({ label: 'activate', click: activate });
applicationMenu.addMenuItemTo('fancyHighlighting.js', deactivateMenuItem);
applicationMenu.addMenuItemTo('fancyHighlighting.js', activateMenuItem);
let highlightLinkFilterPropertyValueBefore;
const highlightLinkFilterPropertyValueFancy = 'contrast(0.5) brightness(1.2) drop-shadow(0 0 3px white)';
async function deactivate() {
    if (!highlightLinkFilterPropertyValueBefore) {
        let message = 'failed to deactivate fancyHighlighting plugin';
        message += ', because highlightLinkFilterPropertyValueBefore is not set, this should never happen.';
        util_1.util.logWarning(message);
        return;
    }
    await domAdapter_1.dom.modifyCssRule('.' + styleAdapter_1.style.getHighlightLinkClass(), 'filter', highlightLinkFilterPropertyValueBefore);
    highlightLinkFilterPropertyValueBefore = undefined;
    deactivateMenuItem.enabled = false;
    activateMenuItem.enabled = true;
    util_1.util.logInfo('deactivated fancyHighlighting plugin');
}
async function activate() {
    const result = await domAdapter_1.dom.modifyCssRule('.' + styleAdapter_1.style.getHighlightLinkClass(), 'filter', highlightLinkFilterPropertyValueFancy);
    highlightLinkFilterPropertyValueBefore = result.propertyValueBefore;
    deactivateMenuItem.enabled = true;
    activateMenuItem.enabled = false;
    util_1.util.logInfo('activated fancyHighlighting plugin');
}
activate();
