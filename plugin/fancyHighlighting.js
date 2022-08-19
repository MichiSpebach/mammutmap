"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const applicationMenu_1 = require("../dist/applicationMenu");
const electron_1 = require("electron");
const util_1 = require("../dist/util");
const domAdapter_1 = require("../dist/domAdapter");
const styleAdapter_1 = require("../dist/styleAdapter");
const BorderingLinks_1 = require("../dist/link/BorderingLinks");
const deactivateMenuItem = new electron_1.MenuItem({ label: 'deactivate', click: deactivate });
const activateMenuItem = new electron_1.MenuItem({ label: 'activate', click: activate });
applicationMenu_1.applicationMenu.addMenuItemTo('fancyHighlighting.js', deactivateMenuItem);
applicationMenu_1.applicationMenu.addMenuItemTo('fancyHighlighting.js', activateMenuItem);
let activated = false;
let highlightLinkFilterPropertyValueBefore;
const highlightLinkFilterPropertyValueFancy = 'contrast(0.5) brightness(1.2) drop-shadow(0 0 3px white)';
async function deactivate() {
    ToggableFancyBorderingLinks.deactivateAndPlugout();
    await ensureDeactivation();
    deactivateMenuItem.enabled = false;
    activateMenuItem.enabled = true;
    util_1.util.logInfo('deactivated fancyHighlighting plugin');
}
async function activate() {
    ToggableFancyBorderingLinks.activateAndPlugin();
    await ensureActivation();
    deactivateMenuItem.enabled = true;
    activateMenuItem.enabled = false;
    util_1.util.logInfo('activated fancyHighlighting plugin');
}
async function ensureDeactivation() {
    if (!activated || !highlightLinkFilterPropertyValueBefore) {
        return;
    }
    await domAdapter_1.dom.modifyCssRule('.' + styleAdapter_1.style.getHighlightLinkClass(), 'filter', highlightLinkFilterPropertyValueBefore);
    highlightLinkFilterPropertyValueBefore = undefined;
    activated = false;
}
async function ensureActivation() {
    if (activated) {
        return;
    }
    const result = await domAdapter_1.dom.modifyCssRule('.' + styleAdapter_1.style.getHighlightLinkClass(), 'filter', highlightLinkFilterPropertyValueFancy);
    if (!highlightLinkFilterPropertyValueBefore) {
        highlightLinkFilterPropertyValueBefore = result.propertyValueBefore;
    }
    activated = true;
}
class ToggableFancyBorderingLinks extends BorderingLinks_1.BorderingLinks {
    static activateAndPlugin() {
        this.setHighlightAllBackup = BorderingLinks_1.BorderingLinks.prototype.setHighlightAll;
        BorderingLinks_1.BorderingLinks.prototype.setHighlightAll = ToggableFancyBorderingLinks.prototype.setHighlightAll;
    }
    static deactivateAndPlugout() {
        BorderingLinks_1.BorderingLinks.prototype.setHighlightAll = ToggableFancyBorderingLinks.setHighlightAllBackup;
    }
    async setHighlightAll(highlight) {
        if (this.links.length > 15) {
            await ensureDeactivation();
        }
        else {
            await ensureActivation();
        }
        return ToggableFancyBorderingLinks.setHighlightAllBackup.call(this, highlight);
    }
}
activate();
