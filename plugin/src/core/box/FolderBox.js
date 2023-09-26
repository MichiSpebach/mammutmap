"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderBox = void 0;
const util_1 = require("../util/util");
const RenderManager_1 = require("../RenderManager");
const styleAdapter_1 = require("../styleAdapter");
const contextMenu = require("../contextMenu");
const Box_1 = require("./Box");
const FolderBoxHeader_1 = require("./header/FolderBoxHeader");
const FolderBoxBody_1 = require("./FolderBoxBody");
const BoxWatcher_1 = require("./BoxWatcher");
const ClientPosition_1 = require("../shape/ClientPosition");
const fileSystemAdapter_1 = require("../fileSystemAdapter");
const logService_1 = require("../logService");
class FolderBox extends Box_1.Box {
    constructor(name, parent, mapData, mapDataFileExists, context) {
        super(name, parent, mapData, mapDataFileExists, context);
        this.body = new FolderBoxBody_1.FolderBoxBody(this);
    }
    createHeader() {
        return new FolderBoxHeader_1.FolderBoxHeader(this);
    }
    isFolder() {
        return true;
    }
    isFile() {
        return false;
    }
    isSourceless() {
        return false;
    }
    getChilds() {
        return [...super.getChilds(), ...this.getBoxes()];
    }
    async renameAndMoveOnFileSystem(oldSrcPath, newSrcPath, oldMapDataFilePath, newMapDataFilePath) {
        await super.renameAndMoveOnFileSystem(oldSrcPath, newSrcPath, oldMapDataFilePath, newMapDataFilePath);
        if (this.isMapDataFileExisting()) {
            const oldMapDataFolderPath = oldMapDataFilePath.replace(/.json$/, '');
            const newMapDataFolderPath = newMapDataFilePath.replace(/.json$/, '');
            if (newMapDataFolderPath !== this.getMapPath()) {
                let message = `FolderBox::renameAndMoveOnFileSystem(..) expected newMapDataFolderPath to be '${this.getMapPath()}', but is '${newMapDataFolderPath}'.`;
                message += ` Hint: newMapDataFolderPath is derived from newMapDataFilePath that is '${newMapDataFilePath}'.`;
                util_1.util.logWarning(message);
            }
            await fileSystemAdapter_1.fileSystem.rename(oldMapDataFolderPath, newMapDataFolderPath);
            util_1.util.logInfo(`moved '${oldMapDataFolderPath}' to '${newMapDataFolderPath}'`);
        }
    }
    getBodyOverflowStyle() {
        return 'visible';
    }
    getBackgroundStyleClass() {
        return styleAdapter_1.style.getFolderBoxBackgroundClass();
    }
    async renderAdditional() {
        if (this.isRendered()) {
            return;
        }
        await RenderManager_1.renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX, clientY) => contextMenu.openForFolderBox(this, new ClientPosition_1.ClientPosition(clientX, clientY)));
    }
    async unrenderAdditional() {
        if (!this.isRendered()) {
            return;
        }
        await RenderManager_1.renderManager.removeEventListenerFrom(this.getId(), 'contextmenu');
    }
    getBodyId() {
        return this.body.getId();
    }
    async renderBody() {
        await this.body.render();
    }
    async unrenderBodyIfPossible(force) {
        return this.body.unrenderIfPossible(force);
    }
    isBodyRendered() {
        return this.body.isRendered();
    }
    isBodyBeingRendered() {
        return this.body.isBeingRendered();
    }
    // TODO: only used by plugins, move into pluginUtil/boxFinder?
    async getBoxBySourcePathAndRenderIfNecessary(path, options) {
        if (!path.startsWith(this.getName())) {
            return this.warn('path ' + path + ' must start with name of box ' + this.getName(), options);
        }
        const temporaryBoxWatcher = new BoxWatcher_1.BoxWatcher(this);
        await this.addWatcherAndUpdateRender(temporaryBoxWatcher);
        const resultBoxWatcherWithWarnings = await this.findBoxInChildsBySourcePathAndRenderIfNecessary(path, options);
        this.removeWatcher(temporaryBoxWatcher);
        return resultBoxWatcherWithWarnings;
    }
    async findBoxInChildsBySourcePathAndRenderIfNecessary(path, options) {
        const remainingPath = util_1.util.removeStartFromPath(this.getName(), path);
        for (const box of this.getBoxes()) {
            if (util_1.util.getElementCountOfPath(remainingPath) === 1 && util_1.util.matchFileNames(remainingPath, box.getName(), options)) {
                if (options?.foreachBoxInPath) {
                    options.foreachBoxInPath(box);
                }
                const boxWatcher = new BoxWatcher_1.BoxWatcher(box);
                await box.addWatcherAndUpdateRender(boxWatcher);
                return { boxWatcher };
            }
            if (util_1.util.getElementsOfPath(remainingPath)[0] === box.getName()) {
                if (options?.foreachBoxInPath) {
                    options.foreachBoxInPath(box);
                }
                if (!box.isFolder() || !(box instanceof FolderBox)) {
                    return this.warn(box.getSrcPath() + ' is not last element in path ' + path + ' but is not a folder', options);
                }
                return box.getBoxBySourcePathAndRenderIfNecessary(remainingPath, options);
            }
        }
        return this.warn(path + ' not found', options);
    }
    // TODO: move to util?
    warn(message, options) {
        if (!options?.onlyReturnWarnings) {
            util_1.util.logWarning(message);
        }
        return { warnings: [message] };
    }
    // TODO: 'getLoadedBoxesInPath' would be more exact, rename?
    getRenderedBoxesInPath(path) {
        const remainingPath = util_1.util.removeStartFromPath(this.getName(), path);
        if (remainingPath === '' || !this.isBodyBeingRendered()) {
            return [this];
        }
        const remainingPathElements = util_1.util.getElementsOfPath(remainingPath);
        for (const box of this.getBoxes()) {
            if (util_1.util.matchFileNames(remainingPathElements[0], box.getName())) {
                if (remainingPathElements.length === 1) {
                    return [this, box];
                }
                if (!box.isFolder() || !(box instanceof FolderBox)) {
                    // TODO: move this method into Box as soon as general Nodes are implemented
                    logService_1.log.warning(`FolderBox::getRenderedBoxesInPath(path: '${path}') '${box.getSrcPath()}' is not last element in path but is also not a folder.`);
                    return [this, box];
                }
                return [this, ...box.getRenderedBoxesInPath(remainingPath)];
            }
        }
        logService_1.log.warning(`FolderBox::getRenderedBoxesInPath(path: '${path}') not found in '${this.getSrcPath()}'.`);
        return [this];
    }
    getBox(id) {
        return this.body.getBox(id);
    }
    getBoxes() {
        return this.body.getBoxes();
    }
    containsBox(box) {
        return this.body.containsBox(box);
    }
    async addNewFileAndSave(name, mapData) {
        await this.body.addNewFileAndSave(name, mapData);
    }
    async addNewFolderAndSave(name, mapData) {
        await this.body.addNewFolderAndSave(name, mapData);
    }
    async addBox(box) {
        return this.body.addBox(box);
    }
    removeBox(box) {
        return this.body.removeBox(box);
    }
    rearrangeBoxesWithoutMapData(grabbedBox) {
        return this.body.rearrangeBoxesWithoutMapData(grabbedBox);
    }
    getInnerLinksRecursive() {
        const innerLinks = this.getBoxes().map(box => box.getInnerLinksRecursive()).flat();
        innerLinks.unshift(this.links);
        return innerLinks;
    }
}
exports.FolderBox = FolderBox;
