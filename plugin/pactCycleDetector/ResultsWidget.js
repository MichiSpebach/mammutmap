"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultsWidget = void 0;
const RenderManager_1 = require("../../dist/RenderManager");
const util_1 = require("../../dist/util");
const Widget_1 = require("../../dist/Widget");
const Cycle_1 = require("./Cycle");
const linkAdder = require("./linkAdder");
class ResultsWidget extends Widget_1.Widget {
    constructor(id, results, afterSubmit) {
        super();
        this.id = id;
        this.results = results;
        this.afterSubmit = afterSubmit;
    }
    getId() {
        return this.id;
    }
    getPathInputIdPrefix() {
        return this.getId() + 'PathInput';
    }
    getResultsSubmitId() {
        return this.getId() + 'Submit';
    }
    async render() {
        let cycleStrings = [];
        for (const result of this.results) {
            cycleStrings = cycleStrings.concat(result.trim().split('\n'));
        }
        const cycles = cycleStrings.map(cycleString => Cycle_1.Cycle.fromString(cycleString));
        await this.renderCycles(cycles);
        await this.renderResultsMapTable(cycles);
    }
    async renderCycles(cycles) {
        let cyclesHtml = '<details>';
        cyclesHtml += '<summary>cycles</summary>';
        for (const cycle of cycles) {
            cyclesHtml += util_1.util.escapeForHtml(cycle.involvedModulesChain.toString()) + '<br>';
        }
        cyclesHtml += '</details>';
        await RenderManager_1.renderManager.addContentTo(this.getId(), cyclesHtml);
    }
    async renderResultsMapTable(cycles) {
        const uniqueModuleNames = this.extractUniqueModuleNames(cycles);
        let tableHtml = '<table>';
        tableHtml += '<tr> <th>moduleName</th> <th>path<th> </tr>';
        for (const uniqueModuleName of uniqueModuleNames) {
            tableHtml += `<tr> <td>${uniqueModuleName}</td> <td><input id="${this.getPathInputIdPrefix() + uniqueModuleName}" value="${uniqueModuleName}"></td> </tr>`;
        }
        tableHtml += '</table>';
        await RenderManager_1.renderManager.addContentTo(this.getId(), tableHtml);
        await RenderManager_1.renderManager.addContentTo(this.getId(), `<button id ="${this.getResultsSubmitId()}">submit and add links</button>`);
        await RenderManager_1.renderManager.addEventListenerTo(this.getResultsSubmitId(), 'click', async () => {
            const moduleNamePathDictionary = new Map();
            for (const uniqueModuleName of uniqueModuleNames) {
                moduleNamePathDictionary.set(uniqueModuleName, await RenderManager_1.renderManager.getValueOf(this.getPathInputIdPrefix() + uniqueModuleName));
            }
            await linkAdder.addLinks(cycles, moduleNamePathDictionary);
            await this.afterSubmit();
        });
    }
    extractUniqueModuleNames(cycles) {
        const uniqueModuleNames = [];
        for (const cycle of cycles) {
            for (const moduleName of cycle.involvedModulesChain) {
                if (!uniqueModuleNames.includes(moduleName)) {
                    uniqueModuleNames.push(moduleName);
                }
            }
        }
        return uniqueModuleNames;
    }
    async unrender() {
        await RenderManager_1.renderManager.removeEventListenerFrom(this.getResultsSubmitId(), 'click');
        await RenderManager_1.renderManager.setContentTo(this.getId(), '');
    }
}
exports.ResultsWidget = ResultsWidget;
