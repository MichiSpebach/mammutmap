"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openIfNotOpened = void 0;
const PopupWidget_1 = require("./PopupWidget");
const RenderManager_1 = require("./RenderManager");
const Settings_1 = require("./Settings");
async function openIfNotOpened() {
    if (!settingsWidget) {
        settingsWidget = new SettingsWidget();
        await settingsWidget.render();
    }
}
exports.openIfNotOpened = openIfNotOpened;
let settingsWidget;
class SettingsWidget extends PopupWidget_1.PopupWidget {
    constructor() {
        super('applicationSettingsWidget', 'ApplicationSettings');
        this.zoomSpeedInputId = this.getId() + 'ZoomSpeed';
        this.boxMinSizeToRenderInputId = this.getId() + 'BoxMinSizeToRender';
        this.boxesDraggableIntoOtherBoxesInputId = this.getId() + 'BoxesDraggableIntoOtherBoxes';
        this.developerModeInputId = this.getId() + 'DeveloperMode';
        this.experimentalFeaturesInputId = this.getId() + 'ExperimentalFeatures';
        this.htmlApplicationMenuInputId = this.getId() + 'HtmlApplicationMenu';
        this.sidebarInputId = this.getId() + 'Sidebar';
    }
    formContent() {
        let zoomSpeedHtml = '<td>';
        zoomSpeedHtml += `<label for="${this.zoomSpeedInputId}">zoomSpeed: </label>`;
        zoomSpeedHtml += '</td><td>';
        zoomSpeedHtml += `<input id="${this.zoomSpeedInputId}"`;
        zoomSpeedHtml += ` type="range" min="1" max="5" value="${Settings_1.settings.getZoomSpeed()}"`;
        zoomSpeedHtml += ` oninput="this.nextElementSibling.value=this.value"`;
        zoomSpeedHtml += `>`;
        zoomSpeedHtml += `<output>${Settings_1.settings.getZoomSpeed()}</output>`;
        zoomSpeedHtml += '</td>';
        let boxMinSizeToRenderHtml = '<td>';
        boxMinSizeToRenderHtml += `<label for="${this.boxMinSizeToRenderInputId}">boxMinSizeToRenderInPixel: </label>`;
        boxMinSizeToRenderHtml += '</td><td>';
        boxMinSizeToRenderHtml += `<input id="${this.boxMinSizeToRenderInputId}"`;
        boxMinSizeToRenderHtml += ` type="number" value="${Settings_1.settings.getBoxMinSizeToRender()}"`;
        boxMinSizeToRenderHtml += `>`;
        boxMinSizeToRenderHtml += '</td>';
        let html = '<table>';
        html += `<tr>${zoomSpeedHtml}</tr>`;
        html += `<tr>${boxMinSizeToRenderHtml}</tr>`;
        html += this.formCheckboxRowHtml(this.boxesDraggableIntoOtherBoxesInputId, 'boxesDraggableIntoOtherBoxes');
        html += this.formCheckboxRowHtml(this.developerModeInputId, 'developerMode');
        html += this.formCheckboxRowHtml(this.experimentalFeaturesInputId, 'experimentalFeatures');
        html += this.formCheckboxRowHtml(this.htmlApplicationMenuInputId, 'htmlApplicationMenu');
        html += this.formCheckboxRowHtml(this.sidebarInputId, 'sidebar');
        html += '</table>';
        return html;
    }
    formCheckboxRowHtml(id, settingsName) {
        let dataCellsHtml = '<td>';
        dataCellsHtml += `<label for="${id}">${settingsName}: </label>`;
        dataCellsHtml += '</td><td>';
        dataCellsHtml += `<input id="${id}"`;
        dataCellsHtml += ` type="checkbox" ${Settings_1.settings.getBoolean(settingsName) ? 'checked' : ''}`;
        dataCellsHtml += `>`;
        dataCellsHtml += '</td>';
        return `<tr>${dataCellsHtml}</tr>`;
    }
    async afterRender() {
        await Promise.all([
            RenderManager_1.renderManager.addChangeListenerTo(this.zoomSpeedInputId, 'value', (value) => Settings_1.settings.setZoomSpeed(parseInt(value))),
            RenderManager_1.renderManager.addChangeListenerTo(this.boxMinSizeToRenderInputId, 'value', (value) => Settings_1.settings.setBoxMinSizeToRender(parseInt(value))),
            this.addChangeListenerToCheckbox(this.boxesDraggableIntoOtherBoxesInputId, 'boxesDraggableIntoOtherBoxes'),
            this.addChangeListenerToCheckbox(this.developerModeInputId, 'developerMode'),
            this.addChangeListenerToCheckbox(this.experimentalFeaturesInputId, 'experimentalFeatures'),
            this.addChangeListenerToCheckbox(this.htmlApplicationMenuInputId, 'htmlApplicationMenu'),
            this.addChangeListenerToCheckbox(this.sidebarInputId, 'sidebar')
        ]);
    }
    async addChangeListenerToCheckbox(id, settingsName) {
        await RenderManager_1.renderManager.addChangeListenerTo(id, 'checked', (value) => Settings_1.settings.setBoolean(settingsName, value));
    }
    async beforeUnrender() {
        settingsWidget = undefined;
        await Promise.all([
            RenderManager_1.renderManager.removeEventListenerFrom(this.zoomSpeedInputId, 'change'),
            RenderManager_1.renderManager.removeEventListenerFrom(this.boxMinSizeToRenderInputId, 'change'),
            RenderManager_1.renderManager.removeEventListenerFrom(this.boxesDraggableIntoOtherBoxesInputId, 'change'),
            RenderManager_1.renderManager.removeEventListenerFrom(this.developerModeInputId, 'change'),
            RenderManager_1.renderManager.removeEventListenerFrom(this.experimentalFeaturesInputId, 'change'),
            RenderManager_1.renderManager.removeEventListenerFrom(this.htmlApplicationMenuInputId, 'change'),
            RenderManager_1.renderManager.removeEventListenerFrom(this.sidebarInputId, 'change')
        ]);
    }
}
