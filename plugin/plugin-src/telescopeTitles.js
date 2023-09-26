"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluginFacade_1 = require("../dist/pluginFacade");
const pluginFacade_2 = require("../dist/pluginFacade");
const deactivateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'deactivate', click: deactivate, enabled: false });
const activateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'activate', click: activate, enabled: true });
pluginFacade_1.applicationMenu.addMenuItemTo('telescopeTitles.js', deactivateMenuItem);
pluginFacade_1.applicationMenu.addMenuItemTo('telescopeTitles.js', activateMenuItem);
async function deactivate() {
    TelescopeBoxHeader.deactivateAndPlugout();
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, false);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, true);
    pluginFacade_2.coreUtil.logInfo('deactivated telescopeTitles plugin');
}
async function activate() {
    TelescopeBoxHeader.activateAndPlugin();
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, true);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, false);
    pluginFacade_2.coreUtil.logInfo('activated telescopeTitles plugin');
}
class TelescopeBoxHeader extends pluginFacade_1.BoxHeader {
    static activateAndPlugin() {
        //const swap = BoxHeader.prototype
        //console.log(TelescopeBoxHeader.getSuperClass())
        //Object.setPrototypeOf(TelescopeBoxHeader.getSuperClass().prototype, null)
        //Object.setPrototypeOf(BoxHeader.prototype, TelescopeBoxHeader.prototype)
        //Object.setPrototypeOf(TelescopeBoxHeader.getSuperClass(), swap)
        this.formTitleHtmlBackup = pluginFacade_1.BoxHeader.prototype.formTitleHtml;
        pluginFacade_1.BoxHeader.prototype.formTitleHtml = TelescopeBoxHeader.prototype.formTitleHtml;
        pluginFacade_1.BoxHeader.prototype.splitInMiddle = TelescopeBoxHeader.prototype.splitInMiddle;
        pluginFacade_1.BoxHeader.prototype.formTitleHtmlSplitInMiddle = TelescopeBoxHeader.prototype.formTitleHtmlSplitInMiddle;
        pluginFacade_1.BoxHeader.prototype.formTitleHtmlSplitBetweenWords = TelescopeBoxHeader.prototype.formTitleHtmlSplitBetweenWords;
        pluginFacade_1.BoxHeader.prototype.splitBetweenWords = TelescopeBoxHeader.prototype.splitBetweenWords;
    }
    static deactivateAndPlugout() {
        pluginFacade_1.BoxHeader.prototype.formTitleHtml = TelescopeBoxHeader.formTitleHtmlBackup;
        pluginFacade_1.BoxHeader.prototype.splitInMiddle = TelescopeBoxHeader.splitInMiddleBackup;
        pluginFacade_1.BoxHeader.prototype.formTitleHtmlSplitInMiddle = TelescopeBoxHeader.formTitleHtmlSplitInMiddleBackup;
        pluginFacade_1.BoxHeader.prototype.formTitleHtmlSplitBetweenWords = TelescopeBoxHeader.formTitleHtmlSplitBetweenWordsBackup;
        pluginFacade_1.BoxHeader.prototype.splitBetweenWords = TelescopeBoxHeader.splitBetweenWordsBackup;
    }
    /*public constructor(referenceBox: Box) {
      super(referenceBox)
    }*/
    static getSuperClass() {
        return Object.getPrototypeOf(TelescopeBoxHeader.prototype).constructor;
    }
    formTitleHtml() {
        return this.formTitleHtmlSplitInMiddle();
    }
    formTitleHtmlSplitInMiddle() {
        const parts = this.splitInMiddle(this.referenceBox.getName());
        let html = `<span style="white-space:nowrap;text-overflow:ellipsis;overflow:hidden;">${parts.left}</span>`;
        html += `<span style="overflow:hidden;"><span style="white-space:nowrap;float:right;">${parts.right}</span></span>`;
        return `<div style="display:flex;">${html}</div>`;
    }
    formTitleHtmlSplitBetweenWords() {
        const parts = this.splitBetweenWords(this.referenceBox.getName());
        const html = parts.map(part => `<span style="text-overflow:ellipsis;overflow:hidden;">${part}</span>`).join('');
        return `<div style="display:flex;">${html}</div>`;
    }
    splitInMiddle(text) {
        const splitIndex = text.length / 2;
        return {
            left: text.substring(0, splitIndex),
            right: text.substring(splitIndex)
        };
    }
    splitBetweenWords(text) {
        let parts = [];
        while (true) {
            let index = text.substring(1).search(/[A-Z._\-/\\\s]/) + 1;
            if (index > 0) {
                if (!text.charAt(index).match(/[A-Z]/)) {
                    index++;
                }
                parts.push(text.substring(0, index));
                text = text.substring(index);
            }
            else {
                parts.push(text);
                break;
            }
        }
        return parts;
    }
}
//activate()
