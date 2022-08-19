"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WizardWidget = void 0;
const PopupWidget_1 = require("../../dist/PopupWidget");
const RenderManager_1 = require("../../dist/RenderManager");
const util_1 = require("../../dist/util");
const ResultsWidget_1 = require("./ResultsWidget");
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
        this.resultsWidget = new ResultsWidget_1.ResultsWidget(this.getId() + 'Results', this.results, () => this.unrender());
        await this.resultsWidget.render();
    }
}
exports.WizardWidget = WizardWidget;
