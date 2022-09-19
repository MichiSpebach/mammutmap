"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Link_1 = require("../dist/box/Link");
const pluginFacade_1 = require("../dist/pluginFacade");
const util_1 = require("../dist/util");
const DidactedLink_1 = require("./linkDidactor/DidactedLink");
const sidebarWidget_1 = require("../dist/toolbars/sidebarWidget");
const LinkDidactorToolbarView_1 = require("./linkDidactor/toolbar/LinkDidactorToolbarView");
const deactivateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'deactivate', click: deactivate });
const activateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'activate', click: activate });
pluginFacade_1.applicationMenu.addMenuItemTo('linkDidactor.js', deactivateMenuItem);
pluginFacade_1.applicationMenu.addMenuItemTo('linkDidactor.js', activateMenuItem);
async function deactivate() {
    (0, Link_1.override)(DidactedLink_1.DidactedLink.getSuperClass());
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, false);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, true);
    util_1.util.logInfo('deactivated linkDidactor plugin');
}
async function activate() {
    (0, Link_1.override)(DidactedLink_1.DidactedLink);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, true);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, false);
    util_1.util.logInfo('activated linkDidactor plugin');
}
activate();
sidebarWidget_1.sidebarWidget.addView(new LinkDidactorToolbarView_1.LinkDidactorToolbarView('LinkDidactor'));
