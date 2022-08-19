"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const applicationMenu = require("../dist/applicationMenu");
const PopupWidget_1 = require("../dist/PopupWidget");
const RenderManager_1 = require("../dist/RenderManager");
const util_1 = require("../dist/util");
const pluginFacade = require("../dist/pluginFacade");
const Widget_1 = require("../dist/Widget");
applicationMenu.addMenuItemTo('pactCycleDetector.js', new electron_1.MenuItem({ label: 'detect...', click: openWizard }));
async function openWizard() {
    new WizardWidget().render();
}
class WizardWidget extends PopupWidget_1.PopupWidget {
    constructor() {
        super('pactCycleDetectorWizard', 'Pact Cycle Detector');
        this.commandInputId = this.getId() + 'CommandInput';
        this.commandSubmitId = this.getId() + 'CommandSubmit';
        this.outputId = this.getId() + 'Output';
        this.results = [];
    }
    formContentHtml() {
        let html = 'Command:<br>';
        html += `<input id="${this.commandInputId}" value="java -jar <path to jar>" autofocus>`;
        html += `<button id="${this.commandSubmitId}">run</button>`;
        html += '<br>';
        html += `<div id="${this.outputId}"></div>`;
        return html;
    }
    async afterRender() {
        await RenderManager_1.renderManager.addEventListenerTo(this.commandSubmitId, 'click', () => this.runCommand());
    }
    async beforeUnrender() {
        await RenderManager_1.renderManager.removeEventListenerFrom(this.commandSubmitId, 'click');
        await this.resultsWidget?.unrender();
    }
    async runCommand() {
        this.results = [];
        await this.resultsWidget?.unrender();
        this.resultsWidget = undefined;
        const command = await RenderManager_1.renderManager.getValueOf(this.commandInputId);
        let process;
        try {
            process = util_1.util.runShellCommand(command);
        }
        catch (e) {
            await RenderManager_1.renderManager.addContentTo(this.outputId, 'Error: ' + util_1.util.escapeForHtml(e.toString()));
            return;
        }
        if (!process.stdout) {
            await RenderManager_1.renderManager.addContentTo(this.outputId, 'Error: process has no stdout.');
            return;
        }
        process.stdout.on('error', (data) => {
            RenderManager_1.renderManager.addContentTo(this.outputId, util_1.util.escapeForHtml(data));
        });
        process.stdout.on('data', (data) => {
            this.results.push(data);
            RenderManager_1.renderManager.addContentTo(this.outputId, util_1.util.escapeForHtml(data));
        });
        process.stdout.on('end', async (data) => {
            let message = 'finished';
            if (data) {
                message += ' with ' + data;
            }
            await RenderManager_1.renderManager.addContentTo(this.outputId, message);
            await this.displayResults();
        });
        await RenderManager_1.renderManager.setContentTo(this.outputId, 'started<br>');
    }
    async displayResults() {
        if (this.resultsWidget) {
            util_1.util.logWarning('expected resultsWidget not to be set at this state');
            this.resultsWidget.unrender();
        }
        await RenderManager_1.renderManager.addContentTo(this.outputId, `<div id="${this.getId() + 'Results'}"></div>`);
        this.resultsWidget = new ResultsWidget(this.getId() + 'Results', this.results, () => this.unrender());
        await this.resultsWidget.render();
    }
}
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
        const cycles = cycleStrings.map(cycleString => Cycle.fromString(cycleString));
        await this.renderCycles(cycles);
        await this.renderResultsMapTable(cycles);
    }
    async renderCycles(cycles) {
        await RenderManager_1.renderManager.addContentTo(this.getId(), '<br>');
        let cyclesHtml = '<details>';
        cyclesHtml += '<summary>cycles</summary>';
        for (const cycle of cycles) {
            cyclesHtml += util_1.util.escapeForHtml(cycle.involvedModulesChain.toString()) + '<br>';
        }
        cyclesHtml += '</details>';
        await RenderManager_1.renderManager.addContentTo(this.getId(), cyclesHtml);
    }
    async renderResultsMapTable(cycles) {
        const uniqueModuleNames = extractUniqueModuleNames(cycles);
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
            await addLinks(cycles, moduleNamePathDictionary);
            await this.afterSubmit();
        });
    }
    async unrender() {
        await RenderManager_1.renderManager.removeEventListenerFrom(this.getResultsSubmitId(), 'click');
        await RenderManager_1.renderManager.setContentTo(this.getId(), '');
    }
}
function extractUniqueModuleNames(cycles) {
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
class Cycle {
    constructor(involvedModulesChain) {
        this.involvedModulesChain = involvedModulesChain;
    }
    static fromString(cycleString) {
        cycleString = cycleString.replace('Cycle{', '');
        cycleString = cycleString.replace('-> ...}', '');
        const moduleNames = cycleString.split('->').map(moduleName => moduleName.trim());
        if (moduleNames.length > 1) {
            moduleNames.push(moduleNames[0]);
        }
        else {
            util_1.util.logWarning(`Expected cycle "${cycleString}" to have at least two elements.`);
        }
        return new Cycle(moduleNames);
    }
}
async function addLinks(cycles, moduleNamePathDictionary) {
    for (const cycle of cycles) {
        for (let i = 0; i < cycle.involvedModulesChain.length - 1; i++) {
            const fromModuleName = cycle.involvedModulesChain[i];
            const toModuleName = cycle.involvedModulesChain[i + 1];
            const fromPath = moduleNamePathDictionary.get(fromModuleName);
            const toPath = moduleNamePathDictionary.get(toModuleName);
            if (!fromPath) {
                util_1.util.logWarning('could not map module ' + fromModuleName);
                continue;
            }
            if (!toPath) {
                util_1.util.logWarning('could not map module ' + toModuleName);
                continue;
            }
            const rootFolder = pluginFacade.getRootFolder();
            const fromBox = (await pluginFacade.findBoxBySourcePath(fromPath, rootFolder)).boxWatcher;
            if (!fromBox) {
                util_1.util.logWarning('could not find box for fromPath ' + fromPath);
                continue;
            }
            const toBox = (await pluginFacade.findBoxBySourcePath(toPath, rootFolder)).boxWatcher;
            if (!toBox) {
                util_1.util.logWarning('could not find box for toPath ' + toPath);
                continue;
            }
            await pluginFacade.addLink((await fromBox.get()), (await toBox.get()).getSrcPath());
            await fromBox.unwatch();
            await toBox.unwatch();
        }
    }
}
