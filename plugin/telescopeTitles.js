"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluginFacade_1 = require("../dist/pluginFacade");
const util_1 = require("../dist/util");
const deactivateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'deactivate', click: deactivate });
const activateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'activate', click: activate });
pluginFacade_1.applicationMenu.addMenuItemTo('telescopeTitles.js', deactivateMenuItem);
pluginFacade_1.applicationMenu.addMenuItemTo('telescopeTitles.js', activateMenuItem);
async function deactivate() {
    TelescopeBoxHeader.deactivateAndPlugout();
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, false);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, true);
    util_1.util.logInfo('deactivated telescopeTitles plugin');
}
async function activate() {
    TelescopeBoxHeader.activateAndPlugin();
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, true);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, false);
    util_1.util.logInfo('activated telescopeTitles plugin');
}
class TelescopeBoxHeader extends pluginFacade_1.BoxHeader {
    static activateAndPlugin() {
        this.formTitleHtmlBackup = pluginFacade_1.BoxHeader.prototype.formTitleHtml;
        pluginFacade_1.BoxHeader.prototype.formTitleHtml = TelescopeBoxHeader.prototype.formTitleHtml;
    }
    static deactivateAndPlugout() {
        pluginFacade_1.BoxHeader.prototype.formTitleHtml = TelescopeBoxHeader.formTitleHtmlBackup;
    }
    /*public constructor(referenceBox: Box) {
      super(referenceBox)
    }*/
    static getSuperClass() {
        return Object.getPrototypeOf(TelescopeBoxHeader.prototype).constructor;
    }
    formTitleHtml() {
        let title = this.referenceBox.getName();
        let parts = [];
        while (true) {
            let index = title.substring(1).search(/[A-Z._/\\]/) + 1;
            if (index > 0) {
                if (!title.charAt(index).match(/[A-Z]/)) {
                    index++;
                }
                parts.push(title.substring(0, index));
                title = title.substring(index);
            }
            else {
                parts.push(title);
                break;
            }
        }
        const html = parts.map(part => `<span style="text-overflow:ellipsis;overflow:hidden;">${part}</span>`).join('');
        return `<div style="display:flex;">${html}</div>`;
    }
}
activate();
