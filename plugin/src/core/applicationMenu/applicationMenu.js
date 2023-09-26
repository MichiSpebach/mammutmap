"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractApplicationMenu = exports.initAndRender = exports.applicationMenu = void 0;
const MenuItemFile_1 = require("./MenuItemFile");
const MenuItemFolder_1 = require("./MenuItemFolder");
const util_1 = require("../util/util");
const map = require("../Map");
const ProjectSettings_1 = require("../ProjectSettings");
const fileSystemAdapter_1 = require("../fileSystemAdapter");
const settingsWidget = require("../settingsWidget");
const RenderManager_1 = require("../RenderManager");
const PopupWidget_1 = require("../PopupWidget");
const Settings_1 = require("../Settings");
async function initAndRender(object) {
    exports.applicationMenu = object;
    await object.initAndRender();
}
exports.initAndRender = initAndRender;
class AbstractApplicationMenu {
    constructor(options) {
        const submenu = [];
        if (!options?.hideFileMenu) {
            submenu.push(this.buildFileMenu());
        }
        submenu.push(this.buildSettingsMenu());
        submenu.push(this.buildPluginsMenu());
        submenu.push(this.buildInfoMenu());
        this.menuTree = new MenuItemFolder_1.MenuItemFolder({ id: 'ApplicationMenu', label: 'ApplicationMenu', submenu });
    }
    buildFileMenu() {
        const openFolderMenuItem = new MenuItemFile_1.MenuItemFile({ label: 'Open Folder...', click: () => this.openFolder() });
        const openFileMenuItem = new MenuItemFile_1.MenuItemFile({ label: 'Open ProjectFile ' + ProjectSettings_1.ProjectSettings.preferredFileNameExtension + '... (experimental)', enabled: Settings_1.settings.getBoolean('experimentalFeatures'), click: () => this.openProjectFile() });
        Settings_1.settings.subscribeBoolean('experimentalFeatures', (newValue) => this.setMenuItemEnabled(openFileMenuItem, newValue));
        return new MenuItemFolder_1.MenuItemFolder({ id: 'File', label: 'File', preferredOpenDirection: 'bottom', submenu: [
                openFolderMenuItem,
                openFileMenuItem
            ] });
    }
    buildSettingsMenu() {
        return new MenuItemFolder_1.MenuItemFolder({ id: 'Settings', label: 'Settings', preferredOpenDirection: 'bottom', submenu: [
                new MenuItemFile_1.MenuItemFile({ label: 'ApplicationSettings', click: () => settingsWidget.openIfNotOpened() }),
                new MenuItemFile_1.MenuItemFile({ label: 'DeveloperTools', click: () => RenderManager_1.renderManager.openDevTools() })
            ] });
    }
    buildPluginsMenu() {
        return new MenuItemFolder_1.MenuItemFolder({ id: 'Plugins', label: 'Plugins', preferredOpenDirection: 'bottom', submenu: [
                new MenuItemFile_1.MenuItemFile({ label: 'MarketPlace (coming soon)', enabled: false, click: () => util_1.util.logInfo('MarketPlace is coming soon') }),
                new MenuItemFile_1.MenuItemFile({ label: 'Tutorial to create plugins', click: () => RenderManager_1.renderManager.openWebLink(util_1.util.pluginTutorialAddress) })
            ] });
    }
    buildInfoMenu() {
        return new MenuItemFile_1.MenuItemFile({ label: 'Info', click: () => {
                PopupWidget_1.PopupWidget.buildAndRender('Info', [
                    { type: 'div', innerHTML: `Join on GitHub: ${util_1.util.createWebLinkHtml(util_1.util.githubProjectAddress)}` },
                    { type: 'div', innerHTML: `Tutorial to create plugins: ${util_1.util.createWebLinkHtml(util_1.util.pluginTutorialAddress)}` },
                ]);
            } });
    }
    async addMenuItemToPlugins(menuItem) {
        await this.addMenuItemTo('Plugins', menuItem);
    }
    async addMenuItemTo(parentMenuItem, menuItem) {
        if (typeof parentMenuItem === 'string') {
            const foundParentMenuItem = this.findMenuItemById(parentMenuItem);
            if (!foundParentMenuItem) {
                util_1.util.logWarning(`Cannot add menuItem '${menuItem.label}' to menu with id '${parentMenuItem}' because it was not found.`);
                return;
            }
            if (!(foundParentMenuItem instanceof MenuItemFolder_1.MenuItemFolder)) {
                util_1.util.logWarning(`Cannot add menuItem '${menuItem.label}' to menu with id '${parentMenuItem}' because it is not a MenuItemFolder.`);
                return;
            }
            parentMenuItem = foundParentMenuItem;
        }
        parentMenuItem.submenu.push(menuItem);
        await this.addMenuItemToAfter(parentMenuItem, menuItem);
    }
    async setMenuItemEnabled(menuItem, enabled) {
        menuItem.enabled = enabled;
        await this.setMenuItemEnabledAfter(menuItem, enabled);
    }
    findMenuItemById(menuItemId) {
        return this.menuTree.findMenuItemById(menuItemId);
    }
    async openFolder() {
        const dialogReturnValue = await fileSystemAdapter_1.fileSystem.showOpenDialog({
            title: 'Open a folder',
            properties: ['openDirectory']
        });
        const folderPaths = dialogReturnValue.filePaths;
        if (folderPaths.length === 0) {
            util_1.util.logInfo('no folder selected');
            return;
        }
        if (folderPaths.length !== 1) {
            util_1.util.logWarning('expected exactly one selected folder but are ' + folderPaths.length);
        }
        map.searchAndLoadMapCloseTo(folderPaths[0]);
    }
    async openProjectFile() {
        const dialogReturnValue = await fileSystemAdapter_1.fileSystem.showOpenDialog({
            title: 'Open a projectFile ' + ProjectSettings_1.ProjectSettings.preferredFileNameExtension,
            properties: ['openFile'],
            filters: [
                { name: '.' + ProjectSettings_1.ProjectSettings.preferredFileNameExtension, extensions: [ProjectSettings_1.ProjectSettings.preferredFileNameExtension] },
                { name: '.' + ProjectSettings_1.ProjectSettings.alternativeFileNameExtension, extensions: [ProjectSettings_1.ProjectSettings.alternativeFileNameExtension] }
            ]
        });
        const filePaths = dialogReturnValue.filePaths;
        if (filePaths.length === 0) {
            util_1.util.logInfo('no file selected');
            return;
        }
        if (filePaths.length !== 1) {
            util_1.util.logWarning('expected exactly one selected file but are ' + filePaths.length);
        }
        const filePath = filePaths[0];
        util_1.util.logInfo('opening existing ProjectSettings at ' + filePath);
        try {
            await map.loadAndSetMap(await ProjectSettings_1.ProjectSettings.loadFromFileSystem(filePath));
        }
        catch (error) {
            util_1.util.logError('Failed to open ProjectSettings at ' + filePath + '. ' + error);
        }
    }
}
exports.AbstractApplicationMenu = AbstractApplicationMenu;
