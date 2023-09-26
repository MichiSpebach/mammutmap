"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Map = exports.unloadAndUnsetMap = exports.loadAndSetMap = exports.searchAndLoadMapCloseTo = exports.setMap = exports.map = exports.onMapUnload = exports.onMapRendered = exports.onMapLoaded = void 0;
const util_1 = require("./util/util");
const domAdapter_1 = require("./domAdapter");
const RenderManager_1 = require("./RenderManager");
const Settings_1 = require("./Settings");
const RelocationDragManager_1 = require("./RelocationDragManager");
const ScaleManager_1 = require("./ScaleManager");
const HoverManager_1 = require("./HoverManager");
const BoxManager_1 = require("./box/BoxManager");
const RootFolderBox_1 = require("./box/RootFolderBox");
const ProjectSettings_1 = require("./ProjectSettings");
const indexHtmlIds = require("./indexHtmlIds");
const fileSystemAdapter_1 = require("./fileSystemAdapter");
const Subscribers_1 = require("./util/Subscribers");
const mouseDownDragManager_1 = require("./mouseDownDragManager");
const LocalPosition_1 = require("./shape/LocalPosition");
const ClientRect_1 = require("./ClientRect");
const Box_1 = require("./box/Box");
const logService_1 = require("./logService");
const LocalRect_1 = require("./LocalRect");
exports.onMapLoaded = new Subscribers_1.Subscribers();
exports.onMapRendered = new Subscribers_1.Subscribers();
exports.onMapUnload = new Subscribers_1.Subscribers();
function setMap(object) {
    if (exports.map) {
        exports.onMapUnload.callSubscribers(); // TODO: call 'await unloadAndUnsetMap()' instead
    }
    exports.map = object;
    if (!exports.map) {
        util_1.util.logWarning('cannot call onLoadedSubscribers because map is not set');
    }
    else {
        exports.onMapLoaded.callSubscribers(exports.map);
        exports.onMapRendered.callSubscribers(exports.map);
    }
}
exports.setMap = setMap;
async function searchAndLoadMapCloseTo(folderPath) {
    const filePathsToLookForProjectSettings = generatePreferredProjectSettingsFilePaths(folderPath)
        .concat(generateAlternativeProjectSettingsFilePaths(folderPath));
    for (const projectSettingsFilePath of filePathsToLookForProjectSettings) {
        if (await fileSystemAdapter_1.fileSystem.doesDirentExistAndIsFile(projectSettingsFilePath)) {
            util_1.util.logInfo('found existing ProjectSettings at ' + projectSettingsFilePath);
            try {
                await loadAndSetMap(await ProjectSettings_1.ProjectSettings.loadFromFileSystem(projectSettingsFilePath));
                return;
            }
            catch (error) {
                util_1.util.logWarning('Failed to open ProjectSettings at ' + projectSettingsFilePath + '. ' + error);
            }
        }
    }
    util_1.util.logInfo('opening new project at ' + folderPath);
    await loadAndSetMap(ProjectSettings_1.ProjectSettings.newWithDefaultData(util_1.util.joinPaths([folderPath, '/map/', ProjectSettings_1.ProjectSettings.preferredFileName])));
}
exports.searchAndLoadMapCloseTo = searchAndLoadMapCloseTo;
function generatePreferredProjectSettingsFilePaths(openedFolderPath) {
    return generateFolderPathsToLookForProjectSettings(openedFolderPath).map((folderPath) => {
        return util_1.util.joinPaths([folderPath, ProjectSettings_1.ProjectSettings.preferredFileName]);
    });
}
function generateAlternativeProjectSettingsFilePaths(openedFolderPath) {
    let projectSettingsFilePaths = [];
    for (const folderPath of generateFolderPathsToLookForProjectSettings(openedFolderPath)) {
        projectSettingsFilePaths = projectSettingsFilePaths.concat(ProjectSettings_1.ProjectSettings.alternativeFileNames.map((fileName) => {
            return util_1.util.joinPaths([folderPath, fileName]);
        }));
    }
    return projectSettingsFilePaths;
}
function generateFolderPathsToLookForProjectSettings(openedFolderPath) {
    return [
        util_1.util.joinPaths([openedFolderPath, '/']),
        util_1.util.joinPaths([openedFolderPath, '/map/']),
        util_1.util.joinPaths([openedFolderPath, '/../']),
        util_1.util.joinPaths([openedFolderPath, '/../map/'])
    ];
}
async function loadAndSetMap(projectSettings) {
    if (exports.map) {
        await unloadAndUnsetMap();
    }
    exports.map = new Map(indexHtmlIds.contentId, projectSettings);
    await exports.onMapLoaded.callSubscribers(exports.map); // TODO: add maximum await time or dialog to force continue in case of defective plugins
    await exports.map.render();
    await exports.onMapRendered.callSubscribers(exports.map); // TODO: add maximum await time or dialog to force continue in case of defective plugins
}
exports.loadAndSetMap = loadAndSetMap;
async function unloadAndUnsetMap() {
    if (!exports.map) {
        util_1.util.logWarning('cannot unload map because no map is loaded');
        return;
    }
    await exports.onMapUnload.callSubscribers(); // TODO: add maximum await time or dialog to force continue in case of defective plugins
    await exports.map.destruct();
    ensureMapUnloaded();
    exports.map = undefined;
}
exports.unloadAndUnsetMap = unloadAndUnsetMap;
function ensureMapUnloaded() {
    if (BoxManager_1.boxManager.getNumberOfBoxes() !== 0) {
        util_1.util.logWarning('Expected all boxes to be unloaded at this state, but there are ' + BoxManager_1.boxManager.getNumberOfBoxes() + ' boxes.');
    }
    if (RenderManager_1.renderManager.getPendingCommandsCount() !== 0) {
        util_1.util.logWarning('Expected no pending render commands at this state, but there are ' + RenderManager_1.renderManager.getPendingCommandsCount() + ' render commands.');
    }
    if (domAdapter_1.dom.getIpcChannelsCount() !== 0) {
        util_1.util.logInfo('There are ' + domAdapter_1.dom.getIpcChannelsCount() + ' ipcChannels at this state.');
    }
    if (RelocationDragManager_1.relocationDragManager.isDraggingInProgress()) {
        util_1.util.logWarning('Expected dragging not to be in progress at this state.');
        RelocationDragManager_1.relocationDragManager.clear();
    }
    if (ScaleManager_1.ScaleManager.isScalingInProgress()) {
        util_1.util.logWarning('Expected scaling not to be in progress at this state.');
        ScaleManager_1.ScaleManager.clear();
    }
    if (HoverManager_1.HoverManager.isHoveringInProgress()) {
        util_1.util.logWarning('Expected hovering not to be in progress at this state.');
        HoverManager_1.HoverManager.clear();
    }
}
class Map {
    constructor(idToRenderIn, projectSettings) {
        this.mapId = 'map';
        this.mapRatioAdjusterId = 'mapRatioAdjuster';
        /** @deprecated calculate dynamically instead */
        this.mapRatioAdjusterSizePx = 600;
        this.moveState = null;
        this.cachedMapClientRect = null;
        this.cachedMapRatioAdjusterClientRect = null;
        this.id = idToRenderIn;
        this.projectSettings = projectSettings;
        const boxContext = { projectSettings, getMapClientRect: () => this.getMapClientRect() };
        this.rootFolder = new RootFolderBox_1.RootFolderBox(boxContext, 'mapRatioAdjuster');
    }
    async render() {
        const mapHtml = `<div id="${this.mapId}" style="overflow:hidden; width:100%; height:100%;"></div>`;
        await RenderManager_1.renderManager.setContentTo(this.id, mapHtml);
        let mapRatioAdjusterStyle = 'position:relative;';
        if (Settings_1.settings.getBoolean('positionMapOnTopLeft')) {
            mapRatioAdjusterStyle += `width:${this.mapRatioAdjusterSizePx}px;height:${this.mapRatioAdjusterSizePx}px;`;
        }
        else {
            const mapClientRect = await this.getMapClientRect();
            const mapRatioAdjusterSizePx = Math.min(mapClientRect.width, mapClientRect.height) * 0.95;
            mapRatioAdjusterStyle += `width:${mapRatioAdjusterSizePx}px;height:${mapRatioAdjusterSizePx}px;left:50%;top:50%;transform:translate(-50%,-50%);`;
        }
        const rootFolderHtml = '<div id="' + this.rootFolder.getId() + '" style="width:100%; height:100%;"></div>';
        const mapRatioAdjusterHtml = `<div id="${this.mapRatioAdjusterId}" style="${mapRatioAdjusterStyle}">${rootFolderHtml}</div>`;
        await RenderManager_1.renderManager.setContentTo(this.mapId, mapRatioAdjusterHtml);
        await Promise.all([
            this.rootFolder.render(),
            RenderManager_1.renderManager.addWheelListenerTo(this.mapId, (delta, clientX, clientY) => this.zoom(-delta, clientX, clientY)),
            mouseDownDragManager_1.mouseDownDragManager.addDraggable({
                elementId: this.mapId,
                onDragStart: (result) => this.movestart(result),
                onDrag: (position, ctrlPressed) => this.move(position, ctrlPressed),
                onDragEnd: (position, ctrlPressed) => this.moveend()
            }),
            RelocationDragManager_1.relocationDragManager.addDropZone(this.mapId),
            RenderManager_1.renderManager.addEventListenerTo(this.mapId, 'dblclick', () => this.rootFolder.site.zoomToFit({ animationIfAlreadyFitting: true }))
        ]);
    }
    async destruct() {
        await this.rootFolder.unrenderIfPossible(true);
        await Promise.all([
            this.rootFolder.destruct(),
            RenderManager_1.renderManager.removeEventListenerFrom(this.mapId, 'wheel'),
            mouseDownDragManager_1.mouseDownDragManager.removeDraggable(this.mapId),
            RelocationDragManager_1.relocationDragManager.removeDropZone(this.mapId),
            RenderManager_1.renderManager.removeEventListenerFrom(this.mapId, 'dblclick')
        ]);
        await RenderManager_1.renderManager.remove(this.mapId);
    }
    getProjectSettings() {
        return this.projectSettings;
    }
    getRootFolder() {
        return this.rootFolder;
    }
    async getMapClientRect() {
        if (!this.cachedMapClientRect) {
            this.cachedMapClientRect = await RenderManager_1.renderManager.getClientRectOf(this.mapId, RenderManager_1.RenderPriority.RESPONSIVE);
        }
        else {
            // in case of some weird window changes, fault is fixed asynchronously and is not permanent
            RenderManager_1.renderManager.getClientRectOf(this.mapId, RenderManager_1.RenderPriority.NORMAL).then(rect => this.cachedMapClientRect = rect);
        }
        return this.cachedMapClientRect;
    }
    async getMapRatioAdjusterClientRect() {
        if (!this.cachedMapRatioAdjusterClientRect) {
            this.cachedMapRatioAdjusterClientRect = await RenderManager_1.renderManager.getClientRectOf(this.mapRatioAdjusterId, RenderManager_1.RenderPriority.RESPONSIVE);
        }
        else {
            // in case of some weird window changes, fault is fixed asynchronously and is not permanent
            RenderManager_1.renderManager.getClientRectOf(this.mapRatioAdjusterId, RenderManager_1.RenderPriority.NORMAL).then(rect => this.cachedMapRatioAdjusterClientRect = rect);
        }
        return this.cachedMapRatioAdjusterClientRect;
    }
    async flyTo(path) {
        const transitionDurationInMS = 500;
        const zoomedInPath = await this.rootFolder.getZoomedInPath(await this.getInnerMapClientRect());
        const renderedTargetPath = this.rootFolder.getRenderedBoxesInPath(path);
        const zoomedTo = zoomedInPath[zoomedInPath.length - 1];
        const renderedTarget = renderedTargetPath[renderedTargetPath.length - 1];
        let zoomingOut = Promise.resolve();
        let latestZoomTo = 'did not zoom';
        if (!(await renderedTarget.getClientRect()).isInsideOrEqual(await this.getMapClientRect())) {
            zoomingOut = this.zoomToFitBoxes([zoomedTo, renderedTarget], { transitionDurationInMS });
            latestZoomTo = { box: Box_1.Box.getCommonAncestorOfPaths(zoomedInPath, renderedTargetPath), promise: zoomingOut };
            zoomingOut = util_1.util.wait(transitionDurationInMS * 0.9); // looks more fluent to not stop while flying to await until everything is rendered
        }
        const renderTargetReport = await this.rootFolder.getBoxBySourcePathAndRenderIfNecessary(path, { foreachBoxInPath: async (box) => {
                await zoomingOut;
                if (!zoomedInPath.includes(box)) {
                    latestZoomTo = { box, promise: box.site.zoomToFit({ transitionDurationInMS }) };
                }
            } });
        if (renderTargetReport.warnings) {
            logService_1.log.warning(`Map::flyTo(path: '${path}') ${renderTargetReport.warnings}`);
        }
        if (!renderTargetReport.boxWatcher) {
            logService_1.log.warning(`Map::flyTo(path: '${path}') failed to getBoxBySourcePathAndRenderIfNecessary`);
            return;
        }
        const targetBox = await renderTargetReport.boxWatcher.get();
        await zoomingOut;
        if (latestZoomTo === 'did not zoom' || targetBox !== latestZoomTo.box) {
            latestZoomTo = { box: targetBox, promise: targetBox.site.zoomToFit({ animationIfAlreadyFitting: true, transitionDurationInMS }) };
        }
        await latestZoomTo.promise;
        await this.zoom(0, 0, 0); // TODO otherwise lots of "has path with no rendered boxes. This only happens when mapData is corrupted or LinkEnd::getRenderedPath() is called when it shouldn't." warnings, fix and remove this line
        await renderTargetReport.boxWatcher.unwatch();
    }
    async getInnerMapClientRect() {
        const mapRect = await this.getMapClientRect();
        const paddingX = mapRect.width / 2.5;
        const paddingY = mapRect.height / 2.5;
        return new ClientRect_1.ClientRect(mapRect.x + paddingX, mapRect.y + paddingY, mapRect.width - paddingX * 2, mapRect.height - paddingY * 2);
    }
    async zoomToFitBoxes(boxes, options) {
        const rectsToFit = boxes.map(box => this.rootFolder.transform.innerRectRecursiveToLocal(box, new LocalRect_1.LocalRect(0, 0, 100, 100)));
        return this.rootFolder.site.zoomToFitRect(LocalRect_1.LocalRect.createEnclosing(rectsToFit), options);
    }
    async zoom(delta, clientX, clientY) {
        const deltaNormalized = delta * Settings_1.settings.getZoomSpeed() / 1500;
        const scaleFactor = delta > 0
            ? 1 + deltaNormalized
            : 1 / (1 - deltaNormalized);
        const mapRatioAdjusterClientRect = await this.getMapRatioAdjusterClientRect();
        const cursorLocalPosition = new LocalPosition_1.LocalPosition(100 * (clientX - mapRatioAdjusterClientRect.x) / mapRatioAdjusterClientRect.width, 100 * (clientY - mapRatioAdjusterClientRect.y) / mapRatioAdjusterClientRect.height);
        await this.rootFolder.site.zoomInParentCoords(scaleFactor, cursorLocalPosition);
        util_1.util.logDebug(`zooming ${delta} finished at x=${clientX} and y=${clientY}`);
        if (Settings_1.settings.getBoolean('developerMode')) {
            this.updateDevStats();
        }
    }
    async movestart(eventResult) {
        if (this.moveState) {
            util_1.util.logWarning('movestart should be called before move');
        }
        this.moveState = {
            latestMousePosition: eventResult.position,
            prevented: eventResult.cursor !== 'auto' && eventResult.cursor !== 'default' || eventResult.ctrlPressed,
            movingStarted: false
        };
        if (this.moveState.prevented) {
            mouseDownDragManager_1.mouseDownDragManager.cancelDrag(this.mapId);
        }
    }
    async move(position, ctrlPressed) {
        if (!this.moveState) {
            util_1.util.logWarning('move should be called between movestart and moveend');
            return;
        }
        if (!this.moveState.movingStarted) {
            this.moveState.movingStarted = true; // TODO: use treshold to block other mouse events only if moved some distance?
            this.updateMouseEventBlockerAndHintToPreventMoving();
        }
        if (this.moveState.prevented) {
            return;
        }
        if (ctrlPressed) {
            this.moveState.prevented = true;
            mouseDownDragManager_1.mouseDownDragManager.cancelDrag(this.mapId);
            this.updateMouseEventBlockerAndHintToPreventMoving();
            return;
        }
        const marginTopOffsetPx = position.y - this.moveState.latestMousePosition.y;
        const marginLeftOffsetPx = position.x - this.moveState.latestMousePosition.x;
        const mapRatioAdjusterClientRect = await this.getMapRatioAdjusterClientRect();
        const marginTopOffsetPercent = marginTopOffsetPx / (mapRatioAdjusterClientRect.height / 100);
        const marginLeftOffsetPercent = marginLeftOffsetPx / (mapRatioAdjusterClientRect.width / 100);
        this.moveState.latestMousePosition = position;
        await this.rootFolder.site.shift(marginLeftOffsetPercent, marginTopOffsetPercent);
        if (Settings_1.settings.getBoolean('developerMode')) {
            this.updateDevStats();
        }
    }
    async moveend() {
        if (!this.moveState) {
            util_1.util.logWarning('moveend should be called after move');
        }
        this.moveState = null;
        this.updateMouseEventBlockerAndHintToPreventMoving();
    }
    updateMouseEventBlockerAndHintToPreventMoving() {
        const visible = !!this.moveState && !this.moveState.prevented;
        util_1.util.setMouseEventBlockerScreenOverlay(visible, RenderManager_1.RenderPriority.RESPONSIVE);
        util_1.util.setHint(Map.hintToPreventMoving, visible);
    }
    async updateDevStats() {
        const devStatsId = this.id + 'devStats';
        if (!this.devStats) {
            this.devStats = {
                type: 'div',
                id: devStatsId,
                style: { position: 'absolute', top: '95px', left: '10px' }
            };
            await RenderManager_1.renderManager.addElementTo(this.id, this.devStats);
        }
        const stats = await this.rootFolder.site.getDetachmentsInRenderedPath();
        const zoomXs = stats.map(detachment => detachment.zoomX);
        let zoomXText = `zoomX = *${zoomXs.join('*')}`;
        if (zoomXs.length > 1) {
            zoomXText += ` = ${zoomXs.reduce((product, value) => product * value)}`;
        }
        const zoomYs = stats.map(detachment => detachment.zoomY);
        let zoomYText = `zoomY = *${zoomYs.join('*')}`;
        if (zoomYs.length > 1) {
            zoomYText += ` = ${zoomYs.reduce((product, value) => product * value)}`;
        }
        const renderedSitesInPath = await this.rootFolder.getZoomedInPath();
        const renderedClientRectsInPath = await Promise.all(renderedSitesInPath.map(box => box.getClientRect()));
        await RenderManager_1.renderManager.setElementsTo(devStatsId, [
            { type: 'div', children: `shiftX = ${stats.map(detachment => detachment.shiftX)}%` },
            { type: 'div', children: `shiftY = ${stats.map(detachment => detachment.shiftY)}%` },
            { type: 'div', children: zoomXText },
            { type: 'div', children: zoomYText },
            { type: 'div', children: `clientXs = ${renderedClientRectsInPath.map(rect => Math.round(rect.x)).join(', ')}` },
            { type: 'div', children: `clientWidths = ${renderedClientRectsInPath.map(rect => Math.round(rect.width)).join(', ')}` }
        ]);
    }
}
exports.Map = Map;
Map.hintToPreventMoving = 'Press CTRL to prevent moving';
