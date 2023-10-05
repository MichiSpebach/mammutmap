"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Box = void 0;
const util_1 = require("../util/util");
const fileSystemAdapter_1 = require("../fileSystemAdapter");
const RenderManager_1 = require("../RenderManager");
const styleAdapter_1 = require("../styleAdapter");
const BoxManager_1 = require("./BoxManager");
const BoxData_1 = require("../mapData/BoxData");
const ScaleTool_1 = require("./ScaleTool");
const BoxLinks_1 = require("./BoxLinks");
const RelocationDragManager_1 = require("../RelocationDragManager");
const HoverManager_1 = require("../HoverManager");
const Transform_1 = require("./Transform");
const Grid_1 = require("./Grid");
const BoxNodesWidget_1 = require("./BoxNodesWidget");
const BorderingLinks_1 = require("../link/BorderingLinks");
const RenderState_1 = require("../util/RenderState");
const SkipToNewestScheduler_1 = require("../util/SkipToNewestScheduler");
const SizeAndPosition_1 = require("./SizeAndPosition");
const AbstractNodeWidget_1 = require("../AbstractNodeWidget");
const logService_1 = require("../logService");
const BoxTabs_1 = require("./tabs/BoxTabs");
class Box extends AbstractNodeWidget_1.AbstractNodeWidget {
    constructor(name, parent, mapData, mapDataFileExists, context) {
        super();
        this.renderState = new RenderState_1.RenderState();
        this.renderScheduler = new SkipToNewestScheduler_1.SkipToNewestScheduler();
        this.watchers = [];
        this.unsavedChanges = false;
        this.name = name;
        this.parent = parent;
        this.mapData = mapData;
        this.mapDataFileExists = mapDataFileExists;
        if (context) {
            this.context = context;
        }
        else if (parent) {
            this.context = parent.context;
        }
        else {
            util_1.util.logError('Box::constructor neither parent nor context are specified, for a RootFolder context has to be specified.');
        }
        this.transform = new Transform_1.Transform(this);
        this.site = new SizeAndPosition_1.SizeAndPosition(this, this.mapData);
        this.header = this.createHeader();
        this.tabs = new BoxTabs_1.BoxTabs(this);
        this.nodes = new BoxNodesWidget_1.BoxNodesWidget(this);
        this.links = new BoxLinks_1.BoxLinks(this);
        this.borderingLinks = new BorderingLinks_1.BorderingLinks(this);
        BoxManager_1.boxManager.addBox(this);
    }
    async destruct() {
        if (this.isRendered()) {
            util_1.util.logWarning('destruct called on rendered box ' + this.getSrcPath() + ', box should be unrendered before');
            await this.unrenderIfPossible(true);
        }
        BoxManager_1.boxManager.removeBox(this);
    }
    getId() {
        return this.mapData.id;
    }
    getGridPlaceHolderId() {
        return this.getId() + 'Grid';
    }
    getBorderId() {
        return this.getId() + 'Border';
    }
    getScaleToolPlaceHolderId() {
        return this.getId() + 'ScaleToolPlaceHolder';
    }
    getName() {
        return this.name;
    }
    getSrcPath() {
        return util_1.util.concatPaths(this.getParent().getSrcPath(), this.getName());
    }
    getMapPath() {
        return util_1.util.concatPaths(this.getParent().getMapPath(), this.getName());
    }
    getMapDataFilePath() {
        return this.getMapPath() + '.json';
    }
    getProjectSettings() {
        return this.getParent().getProjectSettings();
    }
    getParent() {
        if (this.parent == null) {
            util_1.util.logError('Box.getParent() cannot be called on root.');
        }
        return this.parent;
    }
    // TODO: belongs more into map, move?
    async getZoomedInPath(clientRect) {
        const zoomedInChild = await this.getZoomedInChild(clientRect);
        if (!zoomedInChild) {
            return [this];
        }
        return [this, ...await zoomedInChild.getZoomedInPath(clientRect)];
    }
    async getZoomedInChild(clientRect) {
        if (!clientRect) {
            clientRect = await this.context.getMapClientRect();
        }
        let renderedChildBoxes = [];
        for (const child of this.getChilds()) { // filter does not support promises
            if (child instanceof Box && child.isBodyBeingRendered()) {
                if ((await child.getClientRect()).isPositionInside(clientRect.getMidPosition())) {
                    renderedChildBoxes.push(child);
                }
            }
        }
        if (renderedChildBoxes.length < 1) {
            return undefined;
        }
        if (renderedChildBoxes.length !== 1) {
            let message = `Box::getZoomedInChild(..) Expected exactly 1 zoomed in child`;
            message += `, but are ${renderedChildBoxes.length} (${renderedChildBoxes.map(box => box.getName())}).`;
            logService_1.log.warning(message);
        }
        return renderedChildBoxes[0];
    }
    getChilds() {
        return this.nodes.getNodes();
    }
    isRendered() {
        return this.renderState.isRendered();
    }
    isBeingRendered() {
        return this.renderState.isBeingRendered();
    }
    async setParentAndFlawlesslyResizeAndSave(newParent) {
        if (this.site.isDetached()) {
            util_1.util.logWarning(`Box::setParentAndFlawlesslyResizeAndSave(..) called on detached box "${this.getName()}".`);
        }
        if (this.parent == null) {
            util_1.util.logError('Box.setParent() cannot be called on root.');
        }
        const parentClientRect = await this.parent.getClientRect();
        const newParentClientRect = await newParent.getClientRect();
        const borderingLinksToReorder = this.borderingLinks.getAll();
        this.parent.removeBox(this);
        await newParent.addBox(this);
        const oldSrcPath = this.getSrcPath();
        const oldMapDataFilePath = this.getMapDataFilePath();
        this.parent = newParent;
        const newSrcPath = this.getSrcPath();
        const newMapDataFilePath = this.getMapDataFilePath();
        const distanceBetweenParentsX = (parentClientRect.x - newParentClientRect.x) / newParentClientRect.width * 100;
        const distanceBetweenParentsY = (parentClientRect.y - newParentClientRect.y) / newParentClientRect.height * 100;
        const scaleX = parentClientRect.width / newParentClientRect.width;
        const scaleY = parentClientRect.height / newParentClientRect.height;
        const newX = distanceBetweenParentsX + this.mapData.x * scaleX;
        const newY = distanceBetweenParentsY + this.mapData.y * scaleY;
        const newWidth = this.mapData.width * scaleX;
        const newHeight = this.mapData.height * scaleY;
        await this.site.updateMeasures({ x: newX, y: newY, width: newWidth, height: newHeight });
        await this.renameAndMoveOnFileSystem(oldSrcPath, newSrcPath, oldMapDataFilePath, newMapDataFilePath);
        await this.saveMapData();
        await Promise.all(borderingLinksToReorder.map(link => link.reorderAndSaveAndRender({ movedWayPoint: this })));
    }
    async rename(newName) {
        const oldSrcPath = this.getSrcPath();
        const oldMapDataFilePath = this.getMapDataFilePath();
        this.name = newName;
        const newSrcPath = this.getSrcPath();
        const newMapDataFilePath = this.getMapDataFilePath();
        await this.renameAndMoveOnFileSystem(oldSrcPath, newSrcPath, oldMapDataFilePath, newMapDataFilePath);
        await this.header.render();
    }
    async renameAndMoveOnFileSystem(oldSrcPath, newSrcPath, oldMapDataFilePath, newMapDataFilePath) {
        if (!this.isSourceless()) {
            await fileSystemAdapter_1.fileSystem.rename(oldSrcPath, newSrcPath);
            util_1.util.logInfo(`moved '${oldSrcPath}' to '${newSrcPath}'`);
        }
        if (this.isMapDataFileExisting()) {
            await fileSystemAdapter_1.fileSystem.rename(oldMapDataFilePath, newMapDataFilePath);
            util_1.util.logInfo(`moved '${oldMapDataFilePath}' to '${newMapDataFilePath}'`);
        }
    }
    async getParentClientRect() {
        return this.getParent().getClientRect();
    }
    async getClientShape() {
        return this.getClientRect();
    }
    async getClientRect() {
        return this.getParent().transform.localToClientRect(this.getLocalRect());
    }
    getLocalRect() {
        return this.site.getLocalRectToRender();
    }
    getLocalRectToSave() {
        return this.mapData.getRect();
    }
    async addWatcherAndUpdateRender(watcher) {
        this.watchers.push(watcher);
        await this.render();
    }
    async removeWatcherAndUpdateRender(watcher) {
        this.removeWatcher(watcher);
        for (let box = this; !box.isRoot(); box = box.getParent()) {
            await box.render();
            if (box.isBodyRendered()) {
                break;
            }
        }
    }
    removeWatcher(watcher) {
        this.watchers.splice(this.watchers.indexOf(watcher), 1);
    }
    hasWatchers() {
        return this.watchers.length !== 0;
    }
    async render() {
        await this.renderScheduler.schedule(async () => {
            this.renderState.setRenderStarted();
            const pros = [];
            if (!this.renderState.isRendered()) {
                this.renderStyle();
                const styleAbsoluteAndStretched = 'position:absolute;width:100%;height:100%;';
                // TODO: introduce <div id="content"> that contains everything but border and scaleToolPlaceholder? would make sense for detaching mechanism to leave borderFrame at savedPosition
                const backgroundHtml = `<div style="${styleAbsoluteAndStretched}z-index:-1;" class="${this.getBackgroundStyleClass()}"></div>`;
                const gridPlaceHolderHtml = `<div id="${this.getGridPlaceHolderId()}" style="${styleAbsoluteAndStretched}"></div>`;
                const bodyHtml = `<div id="${this.getBodyId()}" style="${styleAbsoluteAndStretched}overflow:${this.getBodyOverflowStyle()};"></div>`;
                const headerHtml = `<div id="${this.header.getId()}" style="position:absolute;overflow:hidden;width:100%;max-height:100%;"></div>`;
                const borderHtml = `<div id="${this.getBorderId()}" class="${styleAdapter_1.style.getBoxBorderClass()} ${styleAdapter_1.style.getAdditionalBoxBorderClass(this.mapDataFileExists)}"></div>`;
                const scaleToolPlaceholderHtml = `<div id="${this.getScaleToolPlaceHolderId()}"></div>`;
                const nodesHtml = `<div id="${this.nodes.getId()}"></div>`;
                const linksHtml = `<div id="${this.links.getId()}"></div>`;
                await RenderManager_1.renderManager.setContentTo(this.getId(), backgroundHtml + gridPlaceHolderHtml + bodyHtml + headerHtml + borderHtml + scaleToolPlaceholderHtml + nodesHtml + linksHtml);
                pros.push(this.header.render());
                pros.push(this.borderingLinks.renderAll());
            }
            pros.push(this.renderBody());
            if (!this.renderState.isRendered()) {
                pros.push(RelocationDragManager_1.relocationDragManager.addDropTarget(this));
                pros.push(HoverManager_1.HoverManager.addHoverable(this, () => this.onHoverOver(), () => this.onHoverOut()));
                pros.push(RenderManager_1.renderManager.addEventListenerTo(this.getId(), 'dblclick', () => this.site.zoomToFit({ animationIfAlreadyFitting: true })));
            }
            pros.push(this.renderAdditional());
            await Promise.all(pros);
            this.renderState.setRenderFinished();
        });
    }
    async unrenderIfPossible(force) {
        await this.renderScheduler.schedule(async () => {
            if (!this.renderState.isRendered()) {
                return;
            }
            this.renderState.setUnrenderStarted();
            if (this.hasWatchers()) {
                if (!force) {
                    this.renderState.setUnrenderFinishedStillRendered();
                    return;
                }
                logService_1.log.warning('Box::unrenderIfPossible(force=true) unrendering box that has watchers, this can happen when folder gets closed while plugins are busy or plugins don\'t clean up.');
            }
            if ((await this.unrenderBodyIfPossible(force)).rendered) {
                this.renderState.setUnrenderFinishedStillRendered();
                return;
            }
            await Promise.all([
                RelocationDragManager_1.relocationDragManager.removeDropTarget(this),
                HoverManager_1.HoverManager.removeHoverable(this),
                this.detachGrid(),
                this.header.unrender(),
                ScaleTool_1.scaleTool.unrenderFrom(this),
                this.unrenderAdditional(),
                this.borderingLinks.renderAllThatShouldBe() // otherwise borderingLinks would not float back to border of parent
            ]);
            this.renderState.setUnrenderFinished();
            return;
        });
        return { rendered: this.renderState.isRendered() };
    }
    async onHoverOver() {
        // TODO: move scaleTool.isScalingInProgress() into HoverManager
        if (ScaleTool_1.scaleTool.isScalingInProgress() || this.renderState.isBeingUnrendered()) {
            return;
        }
        await Promise.all([
            ScaleTool_1.scaleTool.renderInto(this),
            this.borderingLinks.setHighlightAllThatShouldBeRendered(true),
            this.tabs.renderBar()
        ]);
    }
    async onHoverOut() {
        // TODO: move scaleTool.isScalingInProgress() into HoverManager
        if (ScaleTool_1.scaleTool.isScalingInProgress()) {
            return;
        }
        await Promise.all([
            ScaleTool_1.scaleTool.unrenderFrom(this),
            this.borderingLinks.setHighlightAllThatShouldBeRendered(false),
            this.tabs.unrenderBar()
        ]);
    }
    isMapDataFileExisting() {
        return this.mapDataFileExists;
    }
    async setMapDataFileExistsAndUpdateBorderStyle(exists) {
        if (this.mapDataFileExists != exists) {
            this.mapDataFileExists = exists;
            await RenderManager_1.renderManager.addClassTo(this.getBorderId(), styleAdapter_1.style.getAdditionalBoxBorderClass(this.mapDataFileExists));
            await RenderManager_1.renderManager.removeClassFrom(this.getBorderId(), styleAdapter_1.style.getAdditionalBoxBorderClass(!this.mapDataFileExists));
        }
    }
    getMapData() {
        return this.mapData;
    }
    getMapNodeData() {
        return this.mapData.nodes;
    }
    getMapLinkData() {
        return this.mapData.links;
    }
    async restoreMapData() {
        const restoredMapData = await fileSystemAdapter_1.fileSystem.loadFromJsonFile(this.getMapDataFilePath(), (json) => BoxData_1.BoxData.buildFromJson(json));
        if (restoredMapData === null) {
            util_1.util.logWarning('failed to restoreMapData of ' + this.getSrcPath() + ' because mapDataFile does not exist');
            return;
        }
        this.mapData = restoredMapData;
        await this.render();
        return await this.renderStyle();
    }
    async saveMapData() {
        if (!this.context.projectSettings.isDataFileExisting()) {
            await this.context.projectSettings.saveToFileSystem();
        }
        const mapDataFilePath = this.getMapDataFilePath();
        this.mapData.roundFieldsForSave();
        await fileSystemAdapter_1.fileSystem.saveToJsonFile(mapDataFilePath, this.mapData, { throwInsteadOfWarn: true }).then(() => {
            util_1.util.logInfo('saved ' + mapDataFilePath);
            this.setMapDataFileExistsAndUpdateBorderStyle(true);
        }).catch(reason => {
            util_1.util.logWarning(`Box::saveMapData() failed at mapDataFilePath "${mapDataFilePath}", reason is ${reason}`);
        });
    }
    async onDragEnter() {
        await this.attachGrid(RenderManager_1.RenderPriority.RESPONSIVE);
    }
    async onDragLeave() {
        await this.detachGrid(RenderManager_1.RenderPriority.RESPONSIVE);
    }
    async attachGrid(priority = RenderManager_1.RenderPriority.NORMAL) {
        if (this.renderState.isUnrenderInProgress()) {
            util_1.util.logWarning('prevented attaching grid to box that gets unrendered'); // TODO: only to check that this gets triggered, remove
            return;
        }
        await Grid_1.grid.renderInto(this.getGridPlaceHolderId(), priority);
    }
    async detachGrid(priority = RenderManager_1.RenderPriority.NORMAL) {
        await Grid_1.grid.unrenderFrom(this.getGridPlaceHolderId(), priority);
    }
    async renderStyleWithRerender(options) {
        await this.renderStyle(options?.renderStylePriority, options?.transitionDurationInMS);
        const rendered = this.render();
        if (!options?.transitionDurationInMS) {
            return { transitionAndRerender: rendered };
        }
        const transitionDurationInMS = options.transitionDurationInMS;
        const transitionAndRerender = new Promise(async (resolve) => {
            const timelimit = Date.now() + transitionDurationInMS;
            await rendered;
            while (timelimit > Date.now()) {
                await util_1.util.wait(Math.min(20, timelimit - Date.now()));
                if (timelimit <= Date.now()) {
                    break;
                }
                await this.render();
            }
            await this.render(); // rerender at least once after transition finished, to be sure that childs get rendered if they should
            resolve();
        });
        return { transitionAndRerender };
    }
    async renderStyle(priority = RenderManager_1.RenderPriority.NORMAL, transitionDurationInMS) {
        const rect = this.getLocalRect();
        const basicStyle = 'display:inline-block;position:absolute;overflow:visible;';
        const scaleStyle = 'width:' + rect.width + '%;height:' + rect.height + '%;';
        const positionStyle = 'left:' + rect.x + '%;top:' + rect.y + '%;';
        const transitionStyle = transitionDurationInMS ? `transition:${transitionDurationInMS}ms;` : '';
        await RenderManager_1.renderManager.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle + transitionStyle, priority);
    }
    async updateMeasuresAndBorderingLinks(measuresInPercentIfChanged, priority = RenderManager_1.RenderPriority.NORMAL) {
        await this.site.updateMeasures(measuresInPercentIfChanged, priority);
        await this.borderingLinks.renderAll();
    }
    /*private renderBody(): void {
      util.addContentTo(this.getId(), this.formBody())
    }
  
    protected abstract formBody(): string*/
    isDescendantOf(ancestor) {
        for (let descendant = this; !descendant.isRoot(); descendant = descendant.getParent()) {
            if (descendant.getParent() === ancestor) {
                return true;
            }
        }
        return false;
    }
    isAncestorOf(descendant) {
        for (; !descendant.isRoot(); descendant = descendant.getParent()) {
            if (this === descendant.getParent()) {
                return true;
            }
        }
        return false;
    }
    static findCommonAncestor(fromBox, toBox) {
        const fromPath = [fromBox];
        const toPath = [toBox];
        let commonAncestorCandidate = fromBox instanceof Box // TODO: in future it will also make sense that commonAncestor is a general node
            ? fromBox
            : fromBox.getParent();
        while (fromPath[0] !== toPath[0]) {
            if (fromPath[0].isRoot() && toPath[0].isRoot()) {
                util_1.util.logError(fromBox.getSrcPath() + ' and ' + toBox.getSrcPath() + ' do not have a common ancestor, file structure seems to be corrupted.');
            }
            if (!fromPath[0].isRoot()) {
                commonAncestorCandidate = fromPath[0].getParent();
                if (toPath.includes(commonAncestorCandidate)) {
                    toPath.splice(0, Math.min(toPath.indexOf(commonAncestorCandidate) + 1, toPath.length - 1));
                    break;
                }
                else {
                    fromPath.unshift(commonAncestorCandidate);
                }
            }
            if (!toPath[0].isRoot()) {
                commonAncestorCandidate = toPath[0].getParent();
                if (fromPath.includes(commonAncestorCandidate)) {
                    fromPath.splice(0, Math.min(fromPath.indexOf(commonAncestorCandidate) + 1, fromPath.length - 1));
                    break;
                }
                else {
                    toPath.unshift(commonAncestorCandidate);
                }
            }
        }
        return { commonAncestor: commonAncestorCandidate, fromPath, toPath };
    }
    static getCommonAncestorOfPaths(path, otherPath) {
        if (!path[0] || path[0] !== otherPath[0]) {
            logService_1.log.warning(`Box::getCommonAncestor(path: '${path.map(box => box.getName())}', otherPath: '${otherPath.map(box => box.getName())}') expected paths to start with same object.`);
        }
        let commonAncestor = path[0];
        for (let i = 0; i < path.length && i < otherPath.length; i++) {
            if (path[i] === otherPath[i]) {
                commonAncestor = path[i];
            }
            else {
                break;
            }
        }
        return commonAncestor;
    }
}
exports.Box = Box;
Box.Tabs = BoxTabs_1.BoxTabs;
