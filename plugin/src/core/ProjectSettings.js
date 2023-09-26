"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectSettings = void 0;
const fileSystemAdapter_1 = require("./fileSystemAdapter");
const MapSettingsData_1 = require("./mapData/MapSettingsData");
const Subscribers_1 = require("./util/Subscribers");
const util_1 = require("./util/util");
const logService_1 = require("./logService");
const Settings_1 = require("./Settings");
class ProjectSettings {
    static isProjectSettingsFileName(fileName) {
        return fileName === this.preferredFileName || this.alternativeFileNames.includes(fileName);
    }
    static async loadFromFileSystem(filePath) {
        const settingsJson = await fileSystemAdapter_1.fileSystem.readFile(filePath); // TODO: implement and use fileSystem.readJsonFile(path: string): Object|any
        const settingsParsed = JSON.parse(settingsJson);
        const data = MapSettingsData_1.MapSettingsData.ofRawObject(settingsParsed);
        return new ProjectSettings(filePath, data, true);
    }
    static newWithDefaultData(filePath) {
        const data = new MapSettingsData_1.MapSettingsData({
            id: util_1.util.generateId(),
            x: 0, y: 0, width: 100, height: 100,
            links: [],
            nodes: [],
            srcRootPath: '../',
            mapRootPath: './',
            linkTags: []
        });
        if (Settings_1.settings.getBoolean('positionMapOnTopLeft')) {
            // TODO: backwards compatibility for e2e tests, remove asap
            data.x = 5;
            data.y = 5;
            data.width = 90;
            data.height = 90;
        }
        return new ProjectSettings(filePath, data, false);
    }
    constructor(projectSettingsFilePath, data, mapDataFileExists) {
        this.linkTags = new Subscribers_1.Subscribers();
        this.projectSettingsFilePath = projectSettingsFilePath;
        const projectSettingsFolderPath = util_1.util.removeLastElementFromPath(projectSettingsFilePath);
        this.absoluteSrcRootPath = util_1.util.joinPaths([projectSettingsFolderPath, data.srcRootPath]);
        this.absoluteMapRootPath = util_1.util.joinPaths([projectSettingsFolderPath, data.mapRootPath]);
        this.data = data;
        this.dataFileExists = mapDataFileExists;
    }
    async saveToFileSystem() {
        await fileSystemAdapter_1.fileSystem.saveToJsonFile(this.projectSettingsFilePath, this.data, { throwInsteadOfWarn: true }).then(() => {
            logService_1.log.info('saved ProjectSettings into ' + this.projectSettingsFilePath);
            if (!this.dataFileExists) {
                this.addMapFolderToGitignore();
            }
            this.dataFileExists = true;
        }).catch(reason => {
            logService_1.log.warning(`ProjectSettings::saveToFileSystem() failed at projectSettingsFilePath "${this.projectSettingsFilePath}", reason is ${reason}`);
        });
    }
    isDataFileExisting() {
        return this.dataFileExists;
    }
    async addMapFolderToGitignore() {
        const mapFolderPath = this.getAbsoluteMapRootPath();
        const mapFolderName = util_1.util.getElementsOfPath(mapFolderPath).pop();
        if (!mapFolderName) {
            logService_1.log.warning(`ProjectSettings::addMapFolderToGitignore() mapFolderPath '${mapFolderPath}' seems to be empty.`);
            return;
        }
        const gitignorePath = util_1.util.removeLastElementFromPath(mapFolderPath) + '.gitignore';
        if (await fileSystemAdapter_1.fileSystem.doesDirentExistAndIsFile(gitignorePath)) {
            let gitignoreContent = await fileSystemAdapter_1.fileSystem.readFile(gitignorePath);
            gitignoreContent = `# Mammutmap, feel free to remove this line to share the map via Git\n${mapFolderName}/\n\n${gitignoreContent}`;
            await fileSystemAdapter_1.fileSystem.writeFile(gitignorePath, gitignoreContent);
            logService_1.log.info(`ProjectSettings::addMapFolderToGitignore() added '${mapFolderName}/' to '${gitignorePath}', feel free to remove this line from .gitignore to share the map via Git.`);
        }
    }
    getProjectSettingsFilePath() {
        return this.projectSettingsFilePath;
    }
    getAbsoluteSrcRootPath() {
        return this.absoluteSrcRootPath;
    }
    getAbsoluteMapRootPath() {
        return this.absoluteMapRootPath;
    }
    getSrcRootPath() {
        return this.data.srcRootPath;
    }
    getMapRootPath() {
        return this.data.mapRootPath;
    }
    getLinkTags() {
        return this.data.linkTags;
    }
    getLinkTagNamesWithDefaults() {
        return this.data.getLinkTagNamesWithDefaults();
    }
    async countUpLinkTagAndSave(tagName) {
        this.data.countUpLinkTag(tagName);
        this.linkTags.callSubscribers(this.getLinkTags());
        await this.saveToFileSystem();
    }
    async countDownLinkTagAndSave(tagName) {
        this.data.countDownLinkTag(tagName);
        this.linkTags.callSubscribers(this.getLinkTags());
        await this.saveToFileSystem();
    }
    getDefaultLinkAppearance() {
        return this.data.defaultLinkAppearance;
    }
    getRawField(name) {
        return this.data.getRawField(name);
    }
    async setRawFieldAndSave(name, value) {
        this.data.setRawField(name, value);
        await this.saveToFileSystem();
    }
}
exports.ProjectSettings = ProjectSettings;
ProjectSettings.preferredFileNameExtension = 'mapsettings.json';
ProjectSettings.preferredFileName = 'maproot.' + ProjectSettings.preferredFileNameExtension;
ProjectSettings.alternativeFileNameExtension = 'json';
ProjectSettings.alternativeFileNames = ['mapRoot.' + ProjectSettings.alternativeFileNameExtension];
