"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainWidget = void 0;
const Widget_1 = require("./Widget");
const indexHtmlIds = require("./indexHtmlIds");
const Map_1 = require("./Map");
const ToolbarWidget_1 = require("./toolbars/ToolbarWidget");
const RenderManager_1 = require("./RenderManager");
const Settings_1 = require("./Settings");
const util_1 = require("./util/util");
class MainWidget extends Widget_1.Widget {
    constructor() {
        super();
        this.renderedOrInProgress = false;
        this.map = Map_1.map;
        this.sidebar = new ToolbarWidget_1.ToolbarWidget('sidebar');
    }
    getId() {
        return indexHtmlIds.bodyId;
    }
    async render() {
        const pros = [];
        if (!this.renderedOrInProgress) {
            this.renderedOrInProgress = true;
            Settings_1.settings.subscribeBoolean('sidebar', async (active) => this.render());
            Settings_1.settings.subscribeBoolean('developerMode', (newValue) => this.updateDevStats());
            this.updateDevStats();
            await RenderManager_1.renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${this.sidebar.getId()}"></div>`);
        }
        if (Settings_1.settings.getBoolean('sidebar')) {
            pros.push(this.sidebar.render());
        }
        else {
            pros.push(this.sidebar.unrender());
        }
        pros.push(this.adjustWidgets());
        await Promise.all(pros);
    }
    async unrender() {
        util_1.util.logWarning('expected MainWidget::unrender not to be called'); // TODO: add default implementation in super class?
    }
    async adjustWidgets() {
        if (Settings_1.settings.getBoolean('sidebar')) {
            await Promise.all([
                RenderManager_1.renderManager.setStyleTo(this.sidebar.getId(), 'position:absolute;top:0;right:0;height:100%;width:20%;background-color:#303438;'),
                RenderManager_1.renderManager.setStyleTo(indexHtmlIds.contentId, this.getContentStyle(80)),
                RenderManager_1.renderManager.setStyleTo(indexHtmlIds.terminalId, this.getTerminalStyle(80))
            ]);
        }
        else {
            await Promise.all([
                RenderManager_1.renderManager.setStyleTo(this.sidebar.getId(), 'display:none;'),
                RenderManager_1.renderManager.setStyleTo(indexHtmlIds.contentId, this.getContentStyle(100)),
                RenderManager_1.renderManager.setStyleTo(indexHtmlIds.terminalId, this.getTerminalStyle(100))
            ]);
        }
    }
    getContentStyle(widthInPercent) {
        return `width:${widthInPercent}%;height:85%;`;
    }
    getTerminalStyle(widthInPercent) {
        return `width:${widthInPercent}%;height:15%;overflow-x:auto;`;
    }
    async updateDevStats() {
        const devStatsId = this.getId() + 'devStats';
        if (!Settings_1.settings.getBoolean('developerMode')) {
            if (this.devStatsInterval) {
                clearInterval(this.devStatsInterval);
                this.devStatsInterval = undefined;
                await RenderManager_1.renderManager.remove(devStatsId);
            }
            return;
        }
        if (!this.devStatsInterval) {
            this.devStatsInterval = setInterval(() => this.updateDevStats(), 200);
            await RenderManager_1.renderManager.addElementTo(this.getId(), {
                type: 'div',
                id: devStatsId,
                style: { position: 'absolute', top: '50px', left: '10px' },
                children: []
            });
        }
        const cursorPosition = RenderManager_1.renderManager.getCursorClientPosition();
        await RenderManager_1.renderManager.setElementsTo(devStatsId, [
            { type: 'div', children: `clientX = ${cursorPosition.x}` },
            { type: 'div', children: `clientY = ${cursorPosition.y}` }
        ]);
    }
}
exports.mainWidget = new MainWidget();
