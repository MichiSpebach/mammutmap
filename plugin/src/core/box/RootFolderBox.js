"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootFolderBox = void 0;
const FolderBox_1 = require("./FolderBox");
const RenderManager_1 = require("../RenderManager");
class RootFolderBox extends FolderBox_1.FolderBox {
    constructor(context, idRenderedInto) {
        let name = context.projectSettings.getAbsoluteSrcRootPath();
        if (name.endsWith('/')) {
            name = name.substring(0, name.length - 1);
        }
        super(name, null, context.projectSettings.data, context.projectSettings.isDataFileExisting(), context);
        this.cachedClientRect = null;
        this.idRenderedInto = idRenderedInto;
    }
    getSrcPath() {
        return this.context.projectSettings.getAbsoluteSrcRootPath();
    }
    getMapPath() {
        return this.context.projectSettings.getAbsoluteMapRootPath();
    }
    getMapDataFilePath() {
        return this.context.projectSettings.getProjectSettingsFilePath();
    }
    getProjectSettings() {
        return this.context.projectSettings;
    }
    isRoot() {
        return true;
    }
    async saveMapData() {
        if (!this.isMapDataFileExisting()) {
            await this.context.projectSettings.saveToFileSystem();
        }
        await super.saveMapData();
    }
    async renderStyle(priority = RenderManager_1.RenderPriority.NORMAL, transitionDurationInMS) {
        await super.renderStyle(priority, transitionDurationInMS);
        this.clearCachedClientRect();
    }
    async getParentClientRect() {
        return RenderManager_1.renderManager.getClientRectOf(this.idRenderedInto, RenderManager_1.RenderPriority.RESPONSIVE);
    }
    async getClientRect() {
        if (!this.cachedClientRect) {
            this.cachedClientRect = await RenderManager_1.renderManager.getClientRectOf(this.getId(), RenderManager_1.RenderPriority.RESPONSIVE);
        }
        else {
            // in case of some weird window changes, fault is fixed asynchronously and is not permanent
            RenderManager_1.renderManager.getClientRectOf(this.getId(), RenderManager_1.RenderPriority.NORMAL).then(rect => this.cachedClientRect = rect);
        }
        return this.cachedClientRect;
    }
    clearCachedClientRect() {
        this.cachedClientRect = null;
    }
}
exports.RootFolderBox = RootFolderBox;
