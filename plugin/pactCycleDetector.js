"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const applicationMenu = require("../dist/applicationMenu");
const PopupWidget_1 = require("../dist/PopupWidget");
const RenderManager_1 = require("../dist/RenderManager");
const util_1 = require("../dist/util");
const pluginFacade = require("../dist/pluginFacade");
applicationMenu.addMenuItemTo('pactCycleDetector.js', new electron_1.MenuItem({ label: 'detect...', click: openWizard }));
async function openWizard() {
    new Wizard().render();
}
class Wizard extends PopupWidget_1.PopupWidget {
    constructor() {
        super('pactCycleDetectorWizard', 'Pact Cycle Detector');
        this.commandInputId = this.getId() + 'CommandInput';
        this.commandSubmitId = this.getId() + 'CommandSubmit';
        this.outputId = this.getId() + 'Output';
        this.pathInputIdPrefix = this.getId() + 'PathInput';
        this.resultsSubmitId = this.getId() + 'ResultsSubmit';
        this.beforeUnrenderTasks = [];
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
        await Promise.all(this.beforeUnrenderTasks.map(task => task()));
    }
    async runCommand() {
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
            await RenderManager_1.renderManager.setContentTo(this.outputId, 'Error: process has no stdout.');
            return;
        }
        process.stdout.on('error', (data) => {
            RenderManager_1.renderManager.addContentTo(this.outputId, util_1.util.escapeForHtml(data));
        });
        process.stdout.on('data', (data) => {
            this.results.push(data);
            RenderManager_1.renderManager.addContentTo(this.outputId, util_1.util.escapeForHtml(data));
        });
        process.stdout.on('end', (data) => {
            let message = 'finished';
            if (data) {
                message += ' with ' + data;
            }
            RenderManager_1.renderManager.addContentTo(this.outputId, message);
            this.displayResults();
        });
        await RenderManager_1.renderManager.setContentTo(this.outputId, 'started<br>');
    }
    async displayResults() {
        let cycleStrings = [];
        for (const result of this.results) {
            cycleStrings = cycleStrings.concat(result.trim().split('\n'));
        }
        const cycles = cycleStrings.map(cycleString => Cycle.fromString(cycleString));
        await this.displayCycles(cycles);
        await this.displayResultsMapTable(cycles);
    }
    async displayCycles(cycles) {
        await RenderManager_1.renderManager.addContentTo(this.outputId, '<br>');
        let cyclesHtml = '<details>';
        cyclesHtml += '<summary>cycles</summary>';
        for (const cycle of cycles) {
            cyclesHtml += util_1.util.escapeForHtml(cycle.involvedModulesChain.toString()) + '<br>';
        }
        cyclesHtml += '</details>';
        await RenderManager_1.renderManager.addContentTo(this.outputId, cyclesHtml);
    }
    async displayResultsMapTable(cycles) {
        const uniqueModuleNames = extractUniqueModuleNames(cycles);
        let tableHtml = '<table>';
        tableHtml += '<tr> <th>moduleName</th> <th>path<th> </tr>';
        for (const uniqueModuleName of uniqueModuleNames) {
            tableHtml += `<tr> <td>${uniqueModuleName}</td> <td><input id="${this.pathInputIdPrefix + uniqueModuleName}" value="${uniqueModuleName}"></td> </tr>`;
        }
        tableHtml += '</table>';
        await RenderManager_1.renderManager.addContentTo(this.outputId, tableHtml);
        await RenderManager_1.renderManager.addContentTo(this.outputId, `<button id ="${this.resultsSubmitId}">submit and add links</button>`);
        await RenderManager_1.renderManager.addEventListenerTo(this.resultsSubmitId, 'click', async () => {
            const moduleNamePathDictionary = new Map();
            for (const uniqueModuleName of uniqueModuleNames) {
                moduleNamePathDictionary.set(uniqueModuleName, await RenderManager_1.renderManager.getValueOf(this.pathInputIdPrefix + uniqueModuleName));
            }
            await addLinks(cycles, moduleNamePathDictionary);
        });
        this.beforeUnrenderTasks.push(() => RenderManager_1.renderManager.removeEventListenerFrom(this.resultsSubmitId, 'click'));
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
            const fromBox = (await rootFolder.getBoxBySourcePathAndRenderIfNecessary(fromPath)).boxWatcher;
            if (!fromBox) {
                util_1.util.logWarning('could not find box for fromPath ' + fromPath);
                continue;
            }
            const toBox = (await rootFolder.getBoxBySourcePathAndRenderIfNecessary(toPath)).boxWatcher;
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
