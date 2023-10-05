"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxMapDataLoader = void 0;
const util_1 = require("../util/util");
const fileSystemAdapter_1 = require("../fileSystemAdapter");
const BoxData_1 = require("../mapData/BoxData");
const BoxManager_1 = require("./BoxManager");
const ProjectSettings_1 = require("../ProjectSettings");
class BoxMapDataLoader {
    constructor(referenceBox, referenceBoxBody) {
        this.referenceBox = referenceBox;
        this.referenceBoxBody = referenceBoxBody;
    }
    async loadDirents() {
        const sourceDirents = await this.loadSourceDirents();
        const mapFileDirents = await this.loadMapFileDirents();
        const sourcesWithMapData = [];
        for (let mapFileDirentIndex = 0; mapFileDirentIndex < mapFileDirents.length; mapFileDirentIndex++) {
            const mapFileDirent = mapFileDirents[mapFileDirentIndex];
            for (const sourceDirent of sourceDirents) {
                if (sourceDirent.name + '.json' === mapFileDirent.name) {
                    sourcesWithMapData.push({ source: sourceDirent, map: mapFileDirent });
                    sourceDirents.splice(sourceDirents.indexOf(sourceDirent), 1);
                    mapFileDirents.splice(mapFileDirents.indexOf(mapFileDirent), 1);
                    mapFileDirentIndex--;
                    break;
                }
            }
        }
        return { sourcesWithoutMapData: sourceDirents, mapDataWithoutSources: mapFileDirents, sourcesWithMapData };
    }
    loadSourceDirents() {
        return fileSystemAdapter_1.fileSystem.readdir(this.referenceBox.getSrcPath());
    }
    async loadMapFileDirents() {
        const mapPath = this.referenceBox.getMapPath();
        if (!await fileSystemAdapter_1.fileSystem.doesDirentExist(mapPath)) {
            return Promise.resolve([]);
        }
        return (await fileSystemAdapter_1.fileSystem.readdir(mapPath)).filter(dirent => dirent.isFile());
    }
    async loadMapDatasOfSourcesWithMapData(sourcesWithMapData) {
        const sourcesWithLoadingMapData = [];
        for (const sourceWithMap of sourcesWithMapData) {
            if (!this.referenceBoxBody.containsBoxByName(sourceWithMap.source.name)) {
                const mapFilePath = util_1.util.concatPaths(this.referenceBox.getMapPath(), sourceWithMap.map.name);
                const mapData = fileSystemAdapter_1.fileSystem.loadFromJsonFile(mapFilePath, (json) => BoxData_1.BoxData.buildFromJson(json));
                sourcesWithLoadingMapData.push({ source: sourceWithMap.source, mapFilePath, mapData });
            }
        }
        const sourcesWithLoadedMapData = [];
        const sourcesWithLoadingFailedMapData = [];
        for (const sourceWithLoadingMapData of sourcesWithLoadingMapData) {
            const mapData = await sourceWithLoadingMapData.mapData;
            if (!mapData) {
                util_1.util.logWarning('failed to load mapData in ' + sourceWithLoadingMapData.mapFilePath);
                sourcesWithLoadingFailedMapData.push(sourceWithLoadingMapData.source);
                continue;
            }
            if (BoxManager_1.boxManager.getBoxIfExists(mapData.id)) {
                util_1.util.logWarning('skipping ' + sourceWithLoadingMapData.mapFilePath + ' because its id ' + mapData.id + ' is already in use by another box');
                continue;
            }
            sourcesWithLoadedMapData.push({ source: sourceWithLoadingMapData.source, mapData });
        }
        return { sourcesWithLoadedMapData, sourcesWithLoadingFailedMapData };
    }
    filterSourcesWithoutMapData(sourceDirents) {
        for (let sourceDirentIndex = 0; sourceDirentIndex < sourceDirents.length; sourceDirentIndex++) {
            const sourceDirent = sourceDirents[sourceDirentIndex];
            if (this.referenceBoxBody.containsBoxByName(sourceDirent.name)) {
                sourceDirents.splice(sourceDirents.indexOf(sourceDirent), 1);
                sourceDirentIndex--;
            }
        }
        return sourceDirents;
    }
    async loadMapDatasWithoutSources(mapDirents) {
        const mapDatasLoading = [];
        for (const mapDirent of mapDirents) {
            if (!mapDirent.name.endsWith('.json')) {
                util_1.util.logWarning('expected map file to have .json suffix, map file is ' + mapDirent.name);
            }
            const boxName = mapDirent.name.substring(0, mapDirent.name.length - 5);
            if (!this.referenceBoxBody.containsBoxByName(boxName)) {
                const mapFilePath = util_1.util.concatPaths(this.referenceBox.getMapPath(), mapDirent.name);
                const mapData = fileSystemAdapter_1.fileSystem.loadFromJsonFile(mapFilePath, (json) => BoxData_1.BoxData.buildFromJson(json));
                mapDatasLoading.push({ boxName, mapFilePath, mapData });
            }
        }
        const mapDatasLoaded = [];
        for (const mapDataLoading of mapDatasLoading) {
            const mapData = await mapDataLoading.mapData;
            if (!mapData) {
                util_1.util.logWarning('failed to load mapData in ' + mapDataLoading.mapFilePath);
                continue;
            }
            if (BoxManager_1.boxManager.getBoxIfExists(mapData.id)) {
                if (!ProjectSettings_1.ProjectSettings.isProjectSettingsFileName(mapDataLoading.boxName + '.json')) {
                    let message = 'skipping ' + mapDataLoading.mapFilePath;
                    message += ' because its id ' + mapData.id + ' is already in use by another box';
                    util_1.util.logWarning(message);
                }
                continue;
            }
            mapDatasLoaded.push({ boxName: mapDataLoading.boxName, mapData });
        }
        return mapDatasLoaded;
    }
}
exports.BoxMapDataLoader = BoxMapDataLoader;
