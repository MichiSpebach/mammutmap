"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluginFacade_1 = require("../dist/pluginFacade");
const util_1 = require("../dist/util");
const DidactedLink_1 = require("./linkDidactor/DidactedLink");
const sidebarWidget_1 = require("../dist/toolbars/sidebarWidget");
const LinkDidactorToolbarView_1 = require("./linkDidactor/toolbar/LinkDidactorToolbarView");
const DidactedLinkLine_1 = require("./linkDidactor/DidactedLinkLine");
const deactivateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'deactivate', click: deactivate });
const activateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'activate', click: activate });
pluginFacade_1.applicationMenu.addMenuItemTo('linkDidactor.js', deactivateMenuItem);
pluginFacade_1.applicationMenu.addMenuItemTo('linkDidactor.js', activateMenuItem);
async function deactivate() {
    (0, pluginFacade_1.overrideLink)(DidactedLink_1.DidactedLink.getSuperClass());
    (0, pluginFacade_1.overrideLinkLine)(DidactedLinkLine_1.DidactedLinkLine.getSuperClass());
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, false);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, true);
    util_1.util.logInfo('deactivated linkDidactor plugin');
}
async function activate() {
    (0, pluginFacade_1.overrideLink)(DidactedLink_1.DidactedLink);
    (0, pluginFacade_1.overrideLinkLine)(DidactedLinkLine_1.DidactedLinkLine);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, true);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, false);
    util_1.util.logInfo('activated linkDidactor plugin');
}
activate();
sidebarWidget_1.sidebarWidget.addView(new LinkDidactorToolbarView_1.LinkDidactorToolbarView('LinkDidactor'));
