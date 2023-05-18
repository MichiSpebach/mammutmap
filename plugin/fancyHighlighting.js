"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluginFacade_1 = require("../dist/pluginFacade");
const pluginFacade_2 = require("../dist/pluginFacade");
const domAdapter_1 = require("../dist/core/domAdapter");
const pluginFacade_3 = require("../dist/pluginFacade");
const pluginFacade_4 = require("../dist/pluginFacade");
const deactivateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'deactivate', click: deactivate, enabled: false });
const activateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'activate', click: activate });
pluginFacade_1.applicationMenu.addMenuItemTo('fancyHighlighting.js', deactivateMenuItem);
pluginFacade_1.applicationMenu.addMenuItemTo('fancyHighlighting.js', activateMenuItem);
let activated = false;
let highlightLinkFilterPropertyValueBefore;
const highlightLinkFilterPropertyValueFancy = 'contrast(0.5) brightness(1.2) drop-shadow(0 0 3px white)';
async function deactivate() {
    ToggableFancyBorderingLinks.deactivateAndPlugout();
    await ensureDeactivation();
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, false);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, true);
    pluginFacade_2.coreUtil.logInfo('deactivated fancyHighlighting plugin');
}
async function activate() {
    ToggableFancyBorderingLinks.activateAndPlugin();
    await ensureActivation();
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, true);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, false);
    pluginFacade_2.coreUtil.logInfo('activated fancyHighlighting plugin');
}
async function ensureDeactivation() {
    if (!activated || !highlightLinkFilterPropertyValueBefore) {
        return;
    }
    await domAdapter_1.dom.modifyCssRule('.' + pluginFacade_3.style.getHighlightLinkClass(), 'filter', highlightLinkFilterPropertyValueBefore);
    highlightLinkFilterPropertyValueBefore = undefined;
    activated = false;
}
async function ensureActivation() {
    if (activated) {
        return;
    }
    const result = await domAdapter_1.dom.modifyCssRule('.' + pluginFacade_3.style.getHighlightLinkClass(), 'filter', highlightLinkFilterPropertyValueFancy);
    if (!highlightLinkFilterPropertyValueBefore) {
        highlightLinkFilterPropertyValueBefore = result.propertyValueBefore;
    }
    activated = true;
}
class ToggableFancyBorderingLinks extends pluginFacade_4.BorderingLinks {
    static activateAndPlugin() {
        this.setHighlightAllThatShouldBeRenderedBackup = pluginFacade_4.BorderingLinks.prototype.setHighlightAllThatShouldBeRendered;
        pluginFacade_4.BorderingLinks.prototype.setHighlightAllThatShouldBeRendered = ToggableFancyBorderingLinks.prototype.setHighlightAllThatShouldBeRendered;
    }
    static deactivateAndPlugout() {
        pluginFacade_4.BorderingLinks.prototype.setHighlightAllThatShouldBeRendered = ToggableFancyBorderingLinks.setHighlightAllThatShouldBeRenderedBackup;
    }
    async setHighlightAllThatShouldBeRendered(highlight) {
        if (this.links.length > 15) {
            await ensureDeactivation();
        }
        else {
            await ensureActivation();
        }
        return ToggableFancyBorderingLinks.setHighlightAllThatShouldBeRenderedBackup.call(this, highlight);
    }
}
