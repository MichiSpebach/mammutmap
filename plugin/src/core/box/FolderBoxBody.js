"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderBoxBody = void 0;
const util_1 = require("../util/util");
const fileSystemAdapter_1 = require("../fileSystemAdapter");
const RenderManager_1 = require("../RenderManager");
const BoxBody_1 = require("./BoxBody");
const FileBox_1 = require("./FileBox");
const FolderBox_1 = require("./FolderBox");
const BoxData_1 = require("../mapData/BoxData");
const SourcelessBox_1 = require("./SourcelessBox");
const BoxMapDataLoader_1 = require("./BoxMapDataLoader");
const ClientPosition_1 = require("../shape/ClientPosition");
const EmptySpaceFinder_1 = require("./EmptySpaceFinder");
class FolderBoxBody extends BoxBody_1.BoxBody {
    constructor(referenceBox) {
        super(referenceBox);
        this.boxes = [];
        this.tooManyFilesNoticeRendered = false;
        this.referenceFolderBox = referenceBox;
    }
    async executeRender() {
        if (!this.isRendered()) {
            await this.loadMapDatasAndCreateBoxes();
        }
        await this.renderBoxes();
    }
    async executeUnrenderIfPossible(force) {
        if (!this.isRendered()) {
            return { anyChildStillRendered: false };
        }
        let anyChildStillRendered = false;
        await Promise.all(this.boxes.map(async (box) => {
            if ((await box.unrenderIfPossible(force)).rendered) {
                anyChildStillRendered = true;
            }
        }));
        if (!anyChildStillRendered) {
            await this.unrenderTooManyFilesNotice();
            await this.unrenderBoxPlaceholders();
            await this.destructBoxes();
        }
        return { anyChildStillRendered };
    }
    async renderTooManyFilesNotice(count) {
        if (this.tooManyFilesNoticeRendered) {
            return;
        }
        const style = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;';
        let html = `<div id="${this.getTooManyFilesNoticeId()}" style="${style}">`;
        html += `There are ${count} files and folders.<br>`;
        html += `<button id="${this.getTooManyFilesNoticeButtonId()}">render</button>`;
        html += '</div>';
        await RenderManager_1.renderManager.addContentTo(this.getId(), html);
        await RenderManager_1.renderManager.addEventListenerTo(this.getTooManyFilesNoticeButtonId(), 'click', async () => {
            await this.unrenderTooManyFilesNotice();
            await this.loadMapDatasAndCreateBoxes(true);
            await this.renderBoxes();
        });
        this.tooManyFilesNoticeRendered = true;
    }
    async unrenderTooManyFilesNotice() {
        if (!this.tooManyFilesNoticeRendered) {
            return;
        }
        await RenderManager_1.renderManager.removeEventListenerFrom(this.getTooManyFilesNoticeButtonId(), 'click');
        await RenderManager_1.renderManager.remove(this.getTooManyFilesNoticeId());
        this.tooManyFilesNoticeRendered = false;
    }
    getTooManyFilesNoticeId() {
        return this.getId() + 'TooManyFiles';
    }
    getTooManyFilesNoticeButtonId() {
        return this.getTooManyFilesNoticeId() + 'Button';
    }
    async loadMapDatasAndCreateBoxes(unlimitedCount = false) {
        const mapDataLoader = new BoxMapDataLoader_1.BoxMapDataLoader(this.referenceFolderBox, this);
        const dirents = await mapDataLoader.loadDirents();
        const sourcesWithLoadedMapData = await mapDataLoader.loadMapDatasOfSourcesWithMapData(dirents.sourcesWithMapData);
        if (sourcesWithLoadedMapData.sourcesWithLoadingFailedMapData.length > 0) {
            dirents.sourcesWithoutMapData = dirents.sourcesWithoutMapData.concat(...sourcesWithLoadedMapData.sourcesWithLoadingFailedMapData);
        }
        const sourcesWithoutMapData = mapDataLoader.filterSourcesWithoutMapData(dirents.sourcesWithoutMapData);
        const mapDataWithoutSourcesLoaded = mapDataLoader.loadMapDatasWithoutSources(dirents.mapDataWithoutSources);
        const sourceCount = sourcesWithLoadedMapData.sourcesWithLoadedMapData.length + sourcesWithoutMapData.length;
        if (sourceCount > 200 && !unlimitedCount) {
            await this.renderTooManyFilesNotice(sourceCount);
            return;
        }
        this.boxes.push(...await Promise.all(this.createBoxesWithMapData(sourcesWithLoadedMapData.sourcesWithLoadedMapData)));
        this.boxes.push(...await Promise.all(this.createBoxesWithoutSourceData(await mapDataWithoutSourcesLoaded)));
        this.boxes.push(...await Promise.all(this.createBoxesWithoutMapData(sourcesWithoutMapData)));
    }
    createBoxesWithMapData(boxDatas) {
        const boxPromises = [];
        for (const boxData of boxDatas) {
            boxPromises.push(this.createBoxAndRenderPlaceholder(boxData.source.name, boxData.source, boxData.mapData, true));
        }
        return boxPromises;
    }
    createBoxesWithoutSourceData(boxDatas) {
        const boxPromises = [];
        for (const boxData of boxDatas) {
            boxPromises.push(this.createBoxAndRenderPlaceholder(boxData.boxName, undefined, boxData.mapData, true));
        }
        return boxPromises;
    }
    createBoxesWithoutMapData(sources) {
        const boxPromises = [];
        const emptySpaceFinder = new EmptySpaceFinder_1.EmptySpaceFinder(this.boxes.map(box => box.getLocalRectToSave()));
        const emptySpaces = emptySpaceFinder.findEmptySpaces(sources.length);
        if (emptySpaces.length !== sources.length) {
            let message = `Can not load all boxes in ${this.referenceFolderBox.getSrcPath()}`;
            message += `, because number of emptySpaces (${emptySpaces.length}) does not match number of sources (${sources.length})`;
            message += ', this should never happen.';
            util_1.util.logWarning(message);
        }
        for (let i = 0; i < sources.length && i < emptySpaces.length; i++) {
            const mapData = BoxData_1.BoxData.buildNewFromRect(emptySpaces[i]);
            boxPromises.push(this.createBoxAndRenderPlaceholder(sources[i].name, sources[i], mapData, false));
        }
        return boxPromises;
    }
    async rearrangeBoxesWithoutMapData(grabbedBox) {
        const boxesWithMapData = this.boxes.filter(box => box.isMapDataFileExisting() || box === grabbedBox);
        const boxesWithoutMapData = this.boxes.filter(box => !box.isMapDataFileExisting() && box !== grabbedBox);
        const occupiedSpaces = boxesWithMapData.map(box => box.getLocalRectToSave());
        if (!boxesWithMapData.includes(grabbedBox)) {
            // in case grabbedBox is dragged from another parent
            occupiedSpaces.push(await this.referenceFolderBox.transform.clientToLocalRect(await grabbedBox.getClientRect()));
        }
        const emptySpaceFinder = new EmptySpaceFinder_1.EmptySpaceFinder(occupiedSpaces);
        const emptySpaces = emptySpaceFinder.findEmptySpaces(boxesWithoutMapData.length);
        if (emptySpaces.length !== boxesWithoutMapData.length) {
            let message = `Can not rearrange unplaced boxes in ${this.referenceFolderBox.getSrcPath()}`;
            message += `, because number of emptySpaces (${emptySpaces.length}) does not match number of unplaced boxes (${boxesWithoutMapData.length})`;
            message += ', this should never happen.';
            util_1.util.logWarning(message);
        }
        for (let i = 0; i < boxesWithoutMapData.length && i < emptySpaces.length; i++) {
            const box = boxesWithoutMapData[i];
            await box.updateMeasuresAndBorderingLinks(emptySpaces[i]);
        }
    }
    async createBoxAndRenderPlaceholder(name, dirEntry, mapData, mapDataFileExists) {
        let box;
        if (!dirEntry) {
            box = new SourcelessBox_1.SourcelessBox(name, this.referenceFolderBox, mapData, mapDataFileExists, 'source not found');
        }
        else if (dirEntry.isDirectory()) {
            box = new FolderBox_1.FolderBox(name, this.referenceFolderBox, mapData, mapDataFileExists);
        }
        else if (dirEntry.isFile()) {
            box = new FileBox_1.FileBox(name, this.referenceFolderBox, mapData, mapDataFileExists);
        }
        else {
            box = new SourcelessBox_1.SourcelessBox(name, this.referenceFolderBox, mapData, mapDataFileExists, 'unknown source type');
        }
        await this.renderBoxPlaceholderFor(box);
        return box;
    }
    async renderBoxPlaceholderFor(box) {
        const rect = box.getLocalRectToSave();
        let style = `position:absolute;`;
        style += `left:${rect.x}%;top:${rect.y}%;width:${rect.width}%;height:${rect.height}%;`;
        style += 'overflow:hidden;';
        let onwheel = 'return false/*prevents scrolling*/';
        return RenderManager_1.renderManager.addContentTo(this.getId(), `<div id="${box.getId()}" style="${style}" onwheel="${onwheel}">wait for box ${box.getName()} to render</div>`);
    }
    async unrenderBoxPlaceholders() {
        await RenderManager_1.renderManager.setContentTo(this.getId(), '');
    }
    async renderBoxes() {
        await Promise.all(this.boxes.map(async (box) => {
            await box.render();
        }));
    }
    async destructBoxes() {
        const boxes = this.boxes;
        this.boxes = [];
        await Promise.all(boxes.map(async (box) => {
            await box.destruct();
        }));
    }
    containsBox(box) {
        return this.boxes.includes(box);
    }
    containsBoxByName(name) {
        return this.boxes.some(box => box.getName() === name);
    }
    getBox(id) {
        return this.boxes.find((candidate) => candidate.getId() === id);
    }
    getBoxes() {
        return this.boxes;
    }
    async addNewFileAndSave(name, mapData) {
        const newBox = new FileBox_1.FileBox(name, this.referenceFolderBox, mapData, false, this.referenceFolderBox.context);
        await this.addNewBoxAndSave(newBox, (path) => fileSystemAdapter_1.fileSystem.writeFile(path, ""));
    }
    async addNewFolderAndSave(name, mapData) {
        const newBox = new FolderBox_1.FolderBox(name, this.referenceFolderBox, mapData, false, this.referenceFolderBox.context);
        await this.addNewBoxAndSave(newBox, (path) => fileSystemAdapter_1.fileSystem.makeFolder(path));
    }
    async addNewBoxAndSave(box, saveOnFileSystem) {
        this.boxes.push(box);
        await this.renderBoxPlaceholderFor(box);
        await box.render();
        await saveOnFileSystem(box.getSrcPath());
        await box.saveMapData();
    }
    async addBox(box) {
        if (this.containsBox(box)) {
            util_1.util.logWarning('trying to add box that is already contained');
        }
        this.boxes.push(box);
        return RenderManager_1.renderManager.appendChildTo(this.getId(), box.getId());
    }
    removeBox(box) {
        if (!this.containsBox(box)) {
            util_1.util.logWarning('trying to remove box that is not contained');
        }
        this.boxes.splice(this.boxes.indexOf(box), 1);
        // TODO: try to remove from dom?
    }
    // TODO: is this method needed?
    async getBoxesAt(clientX, clientY) {
        if (this.referenceFolderBox.site.isDetached()) {
            util_1.util.logWarning(`FolderBoxBody::getBoxesAt(..) called on detached box "${this.referenceFolderBox.getName()}" but option to specify whether savedPosition or renderedPosition is not implemented.`);
        }
        let boxesAtPostion = [];
        for (var i = 0; i < this.boxes.length; i++) {
            let box = this.boxes[i];
            let clientRect = await box.getClientRect(); // TODO: parallelize, getBoxesAt(..) is called often
            if (clientRect.isPositionInside(new ClientPosition_1.ClientPosition(clientX, clientY))) {
                boxesAtPostion.push(box);
            }
        }
        return boxesAtPostion;
    }
}
exports.FolderBoxBody = FolderBoxBody;
