"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Link_1 = require("../dist/box/Link");
const applicationMenu = require("../dist/applicationMenu");
const electron_1 = require("electron");
const util_1 = require("../dist/util");
const deactivateMenuItem = new electron_1.MenuItem({ label: 'deactivate', click: deactivate });
const activateMenuItem = new electron_1.MenuItem({ label: 'activate', click: activate });
applicationMenu.addMenuItemTo('linkDidactor.js', deactivateMenuItem);
applicationMenu.addMenuItemTo('linkDidactor.js', activateMenuItem);
function deactivate() {
    DidactedLink.deactivateAndPlugout();
    deactivateMenuItem.enabled = false;
    activateMenuItem.enabled = true;
    util_1.util.logInfo('deactivated linkDidactor plugin');
}
function activate() {
    DidactedLink.activateAndPlugin();
    deactivateMenuItem.enabled = true;
    activateMenuItem.enabled = false;
    util_1.util.logInfo('activated linkDidactor plugin');
}
const colors = ['green', 'blue', 'yellow', 'orange', 'magenta', 'aqua', 'lime', 'purple', 'teal'];
class DidactedLink extends Link_1.Link {
    static activateAndPlugin() {
        this.getColorBackup = Link_1.Link.prototype.getColor;
        Link_1.Link.prototype.getColor = DidactedLink.prototype.getColor;
    }
    static deactivateAndPlugout() {
        Link_1.Link.prototype.getColor = DidactedLink.getColorBackup;
    }
    getColor() {
        let toBoxId;
        const dropTargetIfRenderInProgress = this.getTo().getDropTargetIfRenderInProgress();
        if (dropTargetIfRenderInProgress) {
            toBoxId = dropTargetIfRenderInProgress.getId();
        }
        else {
            const path = this.getData().to.path;
            toBoxId = path[path.length - 1].boxId;
        }
        const hash = toBoxId.charCodeAt(0) + toBoxId.charCodeAt(toBoxId.length / 2) + toBoxId.charCodeAt(toBoxId.length - 1);
        return colors[hash % colors.length];
    }
}
activate();
