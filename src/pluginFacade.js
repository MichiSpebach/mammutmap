"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearWatchedBoxes = exports.findBoxBySourcePath = exports.addLinkBetweenBoxes = exports.addLink = exports.FileBoxDepthTreeIterator = exports.getMap = exports.getMapOrError = exports.getRootFolder = exports.getFileBoxIterator = exports.Message = exports.log = exports.NodeWidget = exports.overrideLinkLine = exports.LinkLineImplementation = exports.LinkLine = exports.overrideLink = exports.LinkImplementation = exports.Link = exports.BorderingLinks = exports.BoxHeader = exports.RootFolderBox = exports.FileBox = exports.Box = exports.BoxWatcher = exports.LocalPosition = exports.Transform = exports.WayPointData = exports.LinkTagData = exports.linkAppearanceModes = exports.LinkAppearanceData = exports.applicationSettings = exports.ProjectSettings = exports.onMapUnload = exports.onMapRendered = exports.onMapLoaded = exports.Map = exports.mainWidget = exports.TextInputPopup = exports.PopupWidget = exports.Widget = exports.style = exports.Subscribers = exports.RenderPriority = exports.renderManager = exports.MenuItemFile = exports.contextMenu = exports.applicationMenu = exports.processing = exports.coreUtil = void 0;
const Box_1 = require("./core/box/Box");
Object.defineProperty(exports, "Box", { enumerable: true, get: function () { return Box_1.Box; } });
const FileBox_1 = require("./core/box/FileBox");
Object.defineProperty(exports, "FileBox", { enumerable: true, get: function () { return FileBox_1.FileBox; } });
const RootFolderBox_1 = require("./core/box/RootFolderBox");
Object.defineProperty(exports, "RootFolderBox", { enumerable: true, get: function () { return RootFolderBox_1.RootFolderBox; } });
const Map_1 = require("./core/Map");
Object.defineProperty(exports, "Map", { enumerable: true, get: function () { return Map_1.Map; } });
Object.defineProperty(exports, "onMapLoaded", { enumerable: true, get: function () { return Map_1.onMapLoaded; } });
Object.defineProperty(exports, "onMapRendered", { enumerable: true, get: function () { return Map_1.onMapRendered; } });
Object.defineProperty(exports, "onMapUnload", { enumerable: true, get: function () { return Map_1.onMapUnload; } });
const util_1 = require("./core/util/util");
Object.defineProperty(exports, "coreUtil", { enumerable: true, get: function () { return util_1.util; } });
const processingAdapter_1 = require("./core/processingAdapter");
Object.defineProperty(exports, "processing", { enumerable: true, get: function () { return processingAdapter_1.processing; } });
const WayPointData_1 = require("./core/mapData/WayPointData");
Object.defineProperty(exports, "WayPointData", { enumerable: true, get: function () { return WayPointData_1.WayPointData; } });
const BoxWatcher_1 = require("./core/box/BoxWatcher");
Object.defineProperty(exports, "BoxWatcher", { enumerable: true, get: function () { return BoxWatcher_1.BoxWatcher; } });
const boxFinder = require("./core/pluginUtil/boxFinder");
const Link_1 = require("./core/link/Link");
Object.defineProperty(exports, "Link", { enumerable: true, get: function () { return Link_1.Link; } });
Object.defineProperty(exports, "LinkImplementation", { enumerable: true, get: function () { return Link_1.LinkImplementation; } });
Object.defineProperty(exports, "overrideLink", { enumerable: true, get: function () { return Link_1.override; } });
const applicationMenu_1 = require("./core/applicationMenu/applicationMenu");
Object.defineProperty(exports, "applicationMenu", { enumerable: true, get: function () { return applicationMenu_1.applicationMenu; } });
const MenuItemFile_1 = require("./core/applicationMenu/MenuItemFile");
Object.defineProperty(exports, "MenuItemFile", { enumerable: true, get: function () { return MenuItemFile_1.MenuItemFile; } });
const contextMenu = require("./core/contextMenu");
exports.contextMenu = contextMenu;
const Subscribers_1 = require("./core/util/Subscribers");
Object.defineProperty(exports, "Subscribers", { enumerable: true, get: function () { return Subscribers_1.Subscribers; } });
const RenderManager_1 = require("./core/RenderManager");
Object.defineProperty(exports, "renderManager", { enumerable: true, get: function () { return RenderManager_1.renderManager; } });
Object.defineProperty(exports, "RenderPriority", { enumerable: true, get: function () { return RenderManager_1.RenderPriority; } });
const LinkLine_1 = require("./core/link/LinkLine");
Object.defineProperty(exports, "LinkLine", { enumerable: true, get: function () { return LinkLine_1.LinkLine; } });
Object.defineProperty(exports, "LinkLineImplementation", { enumerable: true, get: function () { return LinkLine_1.LinkLineImplementation; } });
Object.defineProperty(exports, "overrideLinkLine", { enumerable: true, get: function () { return LinkLine_1.override; } });
const ProjectSettings_1 = require("./core/ProjectSettings");
Object.defineProperty(exports, "ProjectSettings", { enumerable: true, get: function () { return ProjectSettings_1.ProjectSettings; } });
const mainWidget_1 = require("./core/mainWidget");
Object.defineProperty(exports, "mainWidget", { enumerable: true, get: function () { return mainWidget_1.mainWidget; } });
const BoxHeader_1 = require("./core/box/header/BoxHeader");
Object.defineProperty(exports, "BoxHeader", { enumerable: true, get: function () { return BoxHeader_1.BoxHeader; } });
const Transform_1 = require("./core/box/Transform");
Object.defineProperty(exports, "Transform", { enumerable: true, get: function () { return Transform_1.Transform; } });
const LocalPosition_1 = require("./core/shape/LocalPosition");
Object.defineProperty(exports, "LocalPosition", { enumerable: true, get: function () { return LocalPosition_1.LocalPosition; } });
const LinkAppearanceData_1 = require("./core/mapData/LinkAppearanceData");
Object.defineProperty(exports, "LinkAppearanceData", { enumerable: true, get: function () { return LinkAppearanceData_1.LinkAppearanceData; } });
Object.defineProperty(exports, "linkAppearanceModes", { enumerable: true, get: function () { return LinkAppearanceData_1.linkAppearanceModes; } });
const styleAdapter_1 = require("./core/styleAdapter");
Object.defineProperty(exports, "style", { enumerable: true, get: function () { return styleAdapter_1.style; } });
const BorderingLinks_1 = require("./core/link/BorderingLinks");
Object.defineProperty(exports, "BorderingLinks", { enumerable: true, get: function () { return BorderingLinks_1.BorderingLinks; } });
const NodeWidget_1 = require("./core/node/NodeWidget");
Object.defineProperty(exports, "NodeWidget", { enumerable: true, get: function () { return NodeWidget_1.NodeWidget; } });
const LinkTagData_1 = require("./core/mapData/LinkTagData");
Object.defineProperty(exports, "LinkTagData", { enumerable: true, get: function () { return LinkTagData_1.LinkTagData; } });
const Widget_1 = require("./core/Widget");
Object.defineProperty(exports, "Widget", { enumerable: true, get: function () { return Widget_1.Widget; } });
const PopupWidget_1 = require("./core/PopupWidget");
Object.defineProperty(exports, "PopupWidget", { enumerable: true, get: function () { return PopupWidget_1.PopupWidget; } });
const TextInputPopup_1 = require("./core/TextInputPopup");
Object.defineProperty(exports, "TextInputPopup", { enumerable: true, get: function () { return TextInputPopup_1.TextInputPopup; } });
const Settings_1 = require("./core/Settings");
Object.defineProperty(exports, "applicationSettings", { enumerable: true, get: function () { return Settings_1.settings; } });
const logService_1 = require("./core/logService");
Object.defineProperty(exports, "log", { enumerable: true, get: function () { return logService_1.log; } });
let boxWatchers = [];
class Message {
    constructor(message) {
        this.message = message;
    }
}
exports.Message = Message;
function getFileBoxIterator() {
    return new FileBoxDepthTreeIterator(getRootFolder());
}
exports.getFileBoxIterator = getFileBoxIterator;
function getRootFolder() {
    return getMapOrError().getRootFolder();
}
exports.getRootFolder = getRootFolder;
function getMapOrError() {
    if (!Map_1.map) {
        util_1.util.logError('a folder has to be openend first to execute this plugin');
    }
    return Map_1.map;
}
exports.getMapOrError = getMapOrError;
function getMap() {
    if (!Map_1.map) {
        return new Message('No folder/project/map opened.');
    }
    return Map_1.map;
}
exports.getMap = getMap;
class FileBoxDepthTreeIterator {
    constructor(rootBox) {
        this.boxIterators = [];
        this.boxIterators.push(new BoxIterator(rootBox.getBoxes()));
        this.nextBox = null;
    }
    async hasNext() {
        await this.prepareNext();
        if (!this.nextBox) {
            clearWatchedBoxes(); // TODO: implement better solution
        }
        return this.nextBox !== null;
    }
    async next() {
        await this.prepareNext();
        if (!this.nextBox) {
            util_1.util.logError('next() was called, but there are no FileBoxes left, call hasNext() to check if next exists');
        }
        const nextBox = this.nextBox;
        this.nextBox = null;
        return nextBox;
    }
    async prepareNext() {
        if (this.nextBox || this.boxIterators.length === 0) {
            return;
        }
        const currentBoxIterator = this.getCurrentBoxIterator();
        if (currentBoxIterator.hasNext()) {
            const nextBox = currentBoxIterator.next();
            await addWatcherAndUpdateRenderFor(nextBox);
            if (nextBox.isFile()) {
                this.nextBox = nextBox;
            }
            else if (nextBox.isFolder()) {
                this.boxIterators.push(new BoxIterator(nextBox.getBoxes()));
                await this.prepareNext();
            }
            else if (nextBox.isSourceless()) {
                await this.prepareNext();
            }
            else {
                util_1.util.logWarning('nextBox (id ' + nextBox.getId() + ') is neither FileBox nor FolderBox nor SourcelessBox');
                await this.prepareNext();
            }
        }
        else {
            this.boxIterators.pop();
            await this.prepareNext();
        }
    }
    getCurrentBoxIterator() {
        return this.boxIterators[this.boxIterators.length - 1];
    }
}
exports.FileBoxDepthTreeIterator = FileBoxDepthTreeIterator;
class BoxIterator {
    constructor(boxes) {
        this.boxes = this.sortBoxesByFilesFirst(boxes);
        this.nextIndex = 0;
    }
    sortBoxesByFilesFirst(boxes) {
        const fileBoxes = [];
        const folderBoxes = [];
        for (const box of boxes) {
            if (box.isFile()) {
                fileBoxes.push(box);
            }
            else {
                folderBoxes.push(box);
            }
        }
        return fileBoxes.concat(folderBoxes);
    }
    hasNext() {
        return this.nextIndex < this.boxes.length;
    }
    next() {
        return this.boxes[this.nextIndex++];
    }
}
async function addLink(fromBox, toFilePath, options) {
    const toReport = await findBoxBySourcePath(toFilePath, fromBox.getParent(), { ...options, registerBoxWatcher: options?.registerBoxWatchersInsteadOfUnwatch });
    if (!toReport.boxWatcher) {
        const message = 'failed to add link because file for toFilePath "' + toFilePath + '" was not found';
        if (!options?.onlyReturnWarnings) {
            util_1.util.logWarning(message);
        }
        const warnings = toReport.warnings ? toReport.warnings.concat(message) : [message];
        return { link: undefined, linkAlreadyExisted: false, warnings };
    }
    const toBox = await toReport.boxWatcher.get();
    const { link, linkAlreadyExisted } = await addLinkBetweenBoxes(fromBox, toBox);
    if (!options?.registerBoxWatchersInsteadOfUnwatch) {
        toReport.boxWatcher.unwatch();
    }
    return { link, linkAlreadyExisted, warnings: toReport.warnings };
}
exports.addLink = addLink;
async function addLinkBetweenBoxes(fromBox, toBox) {
    const managingBox = Box_1.Box.findCommonAncestor(fromBox, toBox).commonAncestor;
    let link = managingBox.links.getLinkWithEndBoxes(fromBox, toBox);
    const linkAlreadyExisted = !!link;
    if (!link) {
        link = await managingBox.links.add(fromBox, toBox);
    }
    return { link, linkAlreadyExisted };
}
exports.addLinkBetweenBoxes = addLinkBetweenBoxes;
async function addWatcherAndUpdateRenderFor(box) {
    const boxWatcher = new BoxWatcher_1.BoxWatcher(box);
    await box.addWatcherAndUpdateRender(boxWatcher);
    boxWatchers.push(boxWatcher);
}
async function findBoxBySourcePath(path, baseOfPath, options) {
    const report = await boxFinder.findBox(path, baseOfPath, options);
    if (report.boxWatcher && options?.registerBoxWatcher) {
        boxWatchers.push(report.boxWatcher);
    }
    return report;
}
exports.findBoxBySourcePath = findBoxBySourcePath;
async function clearWatchedBoxes() {
    while (boxWatchers.length > 0) {
        const boxWatcher = boxWatchers.shift();
        if (boxWatcher) {
            await boxWatcher.unwatch();
        }
    }
}
exports.clearWatchedBoxes = clearWatchedBoxes;
