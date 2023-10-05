"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.settings = void 0;
const util_1 = require("./util/util");
const fileSystemAdapter_1 = require("./fileSystemAdapter");
const logService_1 = require("./logService");
/**
 * uses fileSystemAdapter and has to be called after fileSystemAdapter.init(..)
 */
async function init() {
    if (!fileSystemAdapter_1.fileSystem) {
        logService_1.log.warning('Settings.init() fileSystem is not defined, most likely fileSystemAdapter.init(..) was not called before.');
    }
    try {
        exports.settings = await Settings.loadFromFileSystem();
    }
    catch (error) {
        logService_1.log.warning(`Settings::init() failed to load application settings from fileSystem, reason: "${error}", defaulting to fallback application settings.`);
        exports.settings = Settings.buildFallback();
    }
}
exports.init = init;
// rename to ApplicationSettings?
class Settings {
    static async loadFromFileSystem() {
        let settingsJson;
        if (await fileSystemAdapter_1.fileSystem.doesDirentExistAndIsFile(Settings.settingsFilePath)) {
            settingsJson = await fileSystemAdapter_1.fileSystem.readFile(Settings.settingsFilePath);
        }
        else { // happens when deployed application is started for the first time
            let message = Settings.settingsFilePath + ' not found';
            message += ', loading application settings from ' + Settings.alternativeSettingsFilePath + '.';
            logService_1.log.info(message);
            settingsJson = await fileSystemAdapter_1.fileSystem.readFile(Settings.alternativeSettingsFilePath);
        }
        return Settings.buildFromJson(settingsJson);
    }
    static buildFromJson(settingsJson) {
        const settingsData = JSON.parse(settingsJson);
        settingsData.booleanSubscribers = [];
        const settings = Object.setPrototypeOf(settingsData, Settings.prototype);
        settings.validate();
        return settings;
    }
    static buildFallback() {
        return new Settings();
    }
    constructor() {
        this.zoomSpeed = Settings.defaults.zoomSpeed;
        this.boxMinSizeToRender = Settings.defaults.boxMinSizeToRenderInPixels;
        this.boxesDraggableIntoOtherBoxes = undefined;
        this.developerMode = undefined;
        this.notRethrowUnhandledErrors = undefined;
        this.experimentalFeatures = undefined;
        this.htmlApplicationMenu = undefined;
        this.sidebar = Settings.defaults.sidebar;
        this.positionMapOnTopLeft = undefined; // only needed for old e2e tests, TODO: update e2e tests and remove this option
        this.booleanSubscribers = [];
    }
    validate() {
        if (typeof this.zoomSpeed !== 'number') {
            logService_1.log.warning(`Settings::validate() expected zoomSpeed to be a number but is ${this.zoomSpeed}, defaulting it to ${Settings.defaults.zoomSpeed}.`);
            this.zoomSpeed = Settings.defaults.zoomSpeed;
        }
        if (typeof this.boxMinSizeToRender !== 'number') {
            logService_1.log.warning(`Settings::validate() expected boxMinSizeToRender to be a number but is ${this.boxMinSizeToRender}, defaulting it to ${Settings.defaults.boxMinSizeToRenderInPixels}.`);
            this.boxMinSizeToRender = Settings.defaults.boxMinSizeToRenderInPixels;
        }
        if (typeof this.sidebar !== 'boolean') {
            logService_1.log.warning(`Settings::validate() expected sidebar to be a number but is ${this.sidebar}, defaulting it to ${Settings.defaults.sidebar}.`);
            this.sidebar = Settings.defaults.sidebar;
        }
    }
    async save() {
        const thisWithoutLogic = { ...this };
        thisWithoutLogic.booleanSubscribers = undefined;
        // TODO: merge into existing settings file (not replacing whole file)
        await fileSystemAdapter_1.fileSystem.writeFile(Settings.settingsFilePath, util_1.util.toFormattedJson(thisWithoutLogic), { throwInsteadOfWarn: true })
            .then(() => {
            logService_1.log.info('saved ' + Settings.settingsFilePath);
        })
            .catch(reason => logService_1.log.warning(`Settings::save() failed at settingsFilePath "${Settings.settingsFilePath}", reason is ${reason}`));
    }
    getZoomSpeed() {
        return this.zoomSpeed;
    }
    async setZoomSpeed(value) {
        this.zoomSpeed = value;
        await this.save();
    }
    getBoxMinSizeToRender() {
        return this.boxMinSizeToRender;
    }
    async setBoxMinSizeToRender(value) {
        this.boxMinSizeToRender = value;
        await this.save();
    }
    getNumber(setting) {
        return this[setting];
    }
    async setNumber(setting, value) {
        this[setting] = value;
        await this.save();
    }
    getBoolean(setting) {
        return !!this[setting]; // !! because otherwise undefined would be returned if value is not specified in settingsFile
    }
    async setBoolean(setting, value) {
        this[setting] = value;
        await Promise.all([
            this.save(),
            this.notifyBooleanSubscribersFor(setting)
        ]);
    }
    getRawField(name) {
        return this[name];
    }
    async setRawField(name, value) {
        this[name] = value;
        await this.save();
    }
    async notifyBooleanSubscribersFor(setting) {
        const value = this[setting];
        if (typeof value !== 'boolean') {
            logService_1.log.warning(`Settings::notifyBooleanSubscribersFor(${setting}) expected boolean but is ${value}.`);
            return;
        }
        await Promise.all(this.booleanSubscribers
            .filter(subscriber => subscriber.setting === setting)
            .map(subscriber => subscriber.onSet(value)));
    }
    async subscribeBoolean(setting, onSet) {
        this.booleanSubscribers.push({ setting, onSet });
    }
}
Settings.settingsFileName = 'settings.json';
Settings.settingsFilePath = './' + Settings.settingsFileName;
Settings.alternativeSettingsFilePath = './resources/app/' + Settings.settingsFileName;
Settings.defaults = {
    zoomSpeed: 3,
    boxMinSizeToRenderInPixels: 200,
    sidebar: true
};
