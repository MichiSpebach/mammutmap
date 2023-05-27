"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluginFacade_1 = require("../dist/pluginFacade");
const pluginFacade_2 = require("../dist/pluginFacade");
const DidactedLink_1 = require("./linkAppearance/DidactedLink");
const LinkAppearanceToolbarView_1 = require("./linkAppearance/toolbar/LinkAppearanceToolbarView");
const DidactedLinkLine_1 = require("./linkAppearance/DidactedLinkLine");
const deactivateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'deactivate', click: deactivate });
const activateMenuItem = new pluginFacade_1.MenuItemFile({ label: 'activate', click: activate });
pluginFacade_1.applicationMenu.addMenuItemTo('linkAppearance.js', deactivateMenuItem);
pluginFacade_1.applicationMenu.addMenuItemTo('linkAppearance.js', activateMenuItem);
async function deactivate() {
    (0, pluginFacade_1.overrideLink)(DidactedLink_1.DidactedLink.getSuperClass());
    (0, pluginFacade_1.overrideLinkLine)(DidactedLinkLine_1.DidactedLinkLine.getSuperClass());
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, false);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, true);
    pluginFacade_2.coreUtil.logInfo('deactivated linkAppearance plugin');
}
async function activate() {
    (0, pluginFacade_1.overrideLink)(DidactedLink_1.DidactedLink);
    (0, pluginFacade_1.overrideLinkLine)(DidactedLinkLine_1.DidactedLinkLine);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(deactivateMenuItem, true);
    await pluginFacade_1.applicationMenu.setMenuItemEnabled(activateMenuItem, false);
    pluginFacade_2.coreUtil.logInfo('activated linkAppearance plugin');
}
activate();
pluginFacade_1.mainWidget.sidebar.addView(new LinkAppearanceToolbarView_1.LinkAppearanceToolbarView('LinkAppearance'));
