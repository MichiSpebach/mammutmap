"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openForLink = exports.openForNode = exports.openForSourcelessBox = exports.openForFolderBox = exports.openForFileBox = exports.addFileBoxMenuItem = exports.init = void 0;
const util_1 = require("./util/util");
const WayPointData_1 = require("./mapData/WayPointData");
const RelocationDragManager_1 = require("./RelocationDragManager");
const LinkEndData_1 = require("./mapData/LinkEndData");
const BoxData_1 = require("./mapData/BoxData");
const TextInputPopup_1 = require("./TextInputPopup");
const NodeData_1 = require("./mapData/NodeData");
const PopupWidget_1 = require("./PopupWidget");
const Settings_1 = require("./Settings");
const MenuItemFolder_1 = require("./applicationMenu/MenuItemFolder");
const MenuItemFile_1 = require("./applicationMenu/MenuItemFile");
let contextMenuPopup;
function init(popupImpl) {
    contextMenuPopup = popupImpl;
}
exports.init = init;
const fileBoxMenuItemGenerators = [];
function addFileBoxMenuItem(generator) {
    fileBoxMenuItemGenerators.push(generator);
}
exports.addFileBoxMenuItem = addFileBoxMenuItem;
function openForFileBox(box, position) {
    const items = [
        buildOpenFileInEditorItem(box),
        buildAddLinkItem(box, position),
        buildAddNodeItem(box, position),
        buildRenameBoxItem(box),
        buildRemoveOutgoingLinksItem(box)
    ];
    if (Settings_1.settings.getBoolean('developerMode')) {
        items.push(buildDetailsItem('FileBoxDetails', box));
    }
    fileBoxMenuItemGenerators.forEach(async (generator) => {
        const menuItem = generator(box);
        if (menuItem) {
            items.push(menuItem);
        }
    });
    contextMenuPopup.popup(items, position);
}
exports.openForFileBox = openForFileBox;
function openForFolderBox(box, position) {
    const items = [
        buildAddLinkItem(box, position),
        buildAddNodeItem(box, position),
        buildRenameBoxItem(box),
        buildAddNewFileItem(box, position),
        buildAddNewFolderItem(box, position),
        buildRemoveOutgoingLinksItem(box)
    ];
    if (Settings_1.settings.getBoolean('developerMode')) {
        items.push(buildDetailsItem('FolderBoxDetails', box));
    }
    contextMenuPopup.popup(items, position);
}
exports.openForFolderBox = openForFolderBox;
function openForSourcelessBox(box, position) {
    const items = [
        buildAddLinkItem(box, position),
        buildAddNodeItem(box, position),
        buildRenameBoxItem(box)
    ];
    if (Settings_1.settings.getBoolean('developerMode')) {
        items.push(buildDetailsItem('SourcelessBoxDetails', box));
    }
    contextMenuPopup.popup(items, position);
}
exports.openForSourcelessBox = openForSourcelessBox;
function openForNode(node, position) {
    const items = [];
    if (Settings_1.settings.getBoolean('developerMode')) {
        items.push(buildDetailsItem('NodeDetails', node));
    }
    contextMenuPopup.popup(items, position);
}
exports.openForNode = openForNode;
function openForLink(link, position) {
    const items = [
        buildTagLinkItemFolder(link),
        buildRemoveLinkItem(link)
    ];
    if (Settings_1.settings.getBoolean('developerMode')) {
        items.push(buildDetailsItem('LinkDetails', link));
    }
    contextMenuPopup.popup(items, position);
}
exports.openForLink = openForLink;
function buildOpenFileInEditorItem(box) {
    const command = 'code ' + box.getSrcPath();
    return new MenuItemFile_1.MenuItemFile({ label: 'run ' + command, click: () => {
            util_1.util.runShellCommand(command);
        } });
}
function buildAddLinkItem(box, position) {
    return new MenuItemFile_1.MenuItemFile({ label: 'link from here', click: () => addLinkToBox(box, position) });
}
function buildRemoveOutgoingLinksItem(box) {
    return new MenuItemFile_1.MenuItemFile({ label: 'remove all outgoing links', click: () => {
            box.borderingLinks.getOutgoing().forEach(link => link.getManagingBoxLinks().removeLink(link));
        } });
}
function buildAddNodeItem(box, position) {
    return new MenuItemFile_1.MenuItemFile({ label: 'add link node here', click: () => addNodeToBox(box, position) });
}
function buildTagLinkItemFolder(link) {
    let tags = link.getManagingBox().getProjectSettings().getLinkTagNamesWithDefaults();
    for (const includedTag of link.getTags()) {
        if (!tags.find(tag => tag === includedTag)) {
            util_1.util.logWarning('Corrupted projectSettings detected, expected all linkTags to be registered in projectSettings, but ' + includedTag + ' was not.');
            link.getManagingBox().getProjectSettings().countUpLinkTagAndSave(includedTag);
            tags.push(includedTag);
        }
    }
    const items = tags.map(tag => buildTagLinkItem(link, tag));
    items.push(buildAddOtherTagLinkItem(link));
    return new MenuItemFolder_1.MenuItemFolder({ label: 'tag', submenu: items });
}
function buildAddOtherTagLinkItem(link) {
    return new MenuItemFile_1.MenuItemFile({ label: 'other...', click: async () => {
            const fromBoxName = link.from.getDeepestRenderedWayPoint().linkable.getName();
            const toBoxName = link.to.getDeepestRenderedWayPoint().linkable.getName();
            const tagName = await TextInputPopup_1.TextInputPopup.buildAndRenderAndAwaitResolve(`tag link ${link.getId()} between ${fromBoxName} and ${toBoxName}`, '');
            if (tagName) {
                link.addTag(tagName);
            }
            else {
                util_1.util.logInfo('Dialog to add tag to link was closed without input.');
            }
        } });
}
function buildTagLinkItem(link, tag) {
    const tagIncluded = link.includesTag(tag);
    return new MenuItemFile_1.MenuItemFile({
        label: tagIncluded ? '✓ ' + tag : '    ' + tag,
        click: tagIncluded ? () => link.removeTag(tag) : () => link.addTag(tag)
    });
}
function buildRemoveLinkItem(link) {
    return new MenuItemFile_1.MenuItemFile({ label: 'remove link', click: () => link.getManagingBoxLinks().removeLink(link) });
}
function buildRenameBoxItem(box) {
    return new MenuItemFile_1.MenuItemFile({ label: 'rename', click: async () => {
            const newName = await TextInputPopup_1.TextInputPopup.buildAndRenderAndAwaitResolve('Rename Box', box.getName());
            if (newName) {
                await box.rename(newName);
            }
        } });
}
function buildAddNewFileItem(box, position) {
    return new MenuItemFile_1.MenuItemFile({ label: 'new file', click: async () => {
            const mapData = await buildMapDataForNewBox(box, position);
            await box.addNewFileAndSave(mapData.id, mapData);
            //ScaleManager.startWithClickToDropMode(newBox) // TODO: implement
        } });
}
function buildAddNewFolderItem(box, position) {
    return new MenuItemFile_1.MenuItemFile({ label: 'new folder', click: async () => {
            const mapData = await buildMapDataForNewBox(box, position);
            await box.addNewFolderAndSave(mapData.id, mapData);
            //ScaleManager.startWithClickToDropMode(newBox) // TODO: implement
        } });
}
async function buildMapDataForNewBox(parentBox, position) {
    const positionInParentBox = await parentBox.transform.clientToLocalPosition(position);
    return BoxData_1.BoxData.buildNew(positionInParentBox.percentX, positionInParentBox.percentY, 16, 8);
}
function buildDetailsItem(title, object) {
    return new MenuItemFile_1.MenuItemFile({
        label: 'details',
        click: () => {
            buildDetailsPopupWidget(title, object).render();
        }
    });
}
function buildDetailsPopupWidget(title, object) {
    // TODO: move to own file
    return new class extends PopupWidget_1.PopupWidget {
        constructor() {
            super(util_1.util.generateId() + title, title);
        }
        formContent() {
            // TODO: render this in zoomable map would be cool, introduce ObjectBox|JsonBox for this, or better handled by plugin?
            return {
                type: 'pre',
                innerHTML: util_1.util.escapeForHtml(util_1.util.stringify(object))
            };
        }
    };
}
// TODO: move into Box?
async function addLinkToBox(box, position) {
    const positionInBox = await box.transform.clientToLocalPosition(position);
    const fromWayPoint = WayPointData_1.WayPointData.buildNew(box.getId(), box.getName(), positionInBox.percentX, positionInBox.percentY);
    const toWayPoint = WayPointData_1.WayPointData.buildNew(box.getId(), box.getName(), positionInBox.percentX, positionInBox.percentY);
    const from = { mapData: new LinkEndData_1.LinkEndData([fromWayPoint], true), linkable: box };
    const to = { mapData: new LinkEndData_1.LinkEndData([toWayPoint], true), linkable: box };
    const link = await box.links.addLink(from, to, false);
    await RelocationDragManager_1.relocationDragManager.startDragWithClickToDropMode(link.getTo());
}
async function addNodeToBox(box, position) {
    const positionInBox = await box.transform.clientToLocalPosition(position);
    await box.nodes.add(NodeData_1.NodeData.buildNew(positionInBox.percentX, positionInBox.percentY));
}
