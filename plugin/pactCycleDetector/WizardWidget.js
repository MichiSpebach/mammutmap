"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WizardWidget = void 0;
const pluginFacade_1 = require("../../dist/pluginFacade");
const pluginFacade_2 = require("../../dist/pluginFacade");
const pluginFacade_3 = require("../../dist/pluginFacade");
const ResultsWidget_1 = require("./ResultsWidget");
class WizardWidget extends pluginFacade_1.PopupWidget {
    constructor() {
        super('pactCycleDetectorWizard', 'Pact Cycle Detector');
        this.commandInputId = this.getId() + 'CommandInput';
        this.commandSubmitId = this.getId() + 'CommandSubmit';
        this.outputId = this.getId() + 'Output';
        this.results = [];
    }
    formContent() {
        let html = 'Command:<br>';
        html += `<input id="${this.commandInputId}" value="java -jar <path to jar>" autofocus>`;
        html += `<button id="${this.commandSubmitId}">run</button>`;
        html += '<br>';
        html += `<div id="${this.outputId}"></div>`;
        return html;
    }
    async afterRender() {
        await pluginFacade_2.renderManager.addEventListenerTo(this.commandSubmitId, 'click', () => this.runCommand());
    }
    async beforeUnrender() {
        await pluginFacade_2.renderManager.removeEventListenerFrom(this.commandSubmitId, 'click');
        await this.resultsWidget?.unrender();
    }
    async runCommand() {
        this.results = [];
        await this.resultsWidget?.unrender();
        this.resultsWidget = undefined;
        const command = await pluginFacade_2.renderManager.getValueOf(this.commandInputId);
        let process;
        try {
            process = pluginFacade_3.coreUtil.runShellCommand(command);
        }
        catch (e) {
            await pluginFacade_2.renderManager.addContentTo(this.outputId, 'Error: ' + pluginFacade_3.coreUtil.escapeForHtml(e.toString()));
            return;
        }
        if (!process.stdout) {
            await pluginFacade_2.renderManager.addContentTo(this.outputId, 'Error: process has no stdout.');
            return;
        }
        process.stdout.on('error', (data) => {
            pluginFacade_2.renderManager.addContentTo(this.outputId, pluginFacade_3.coreUtil.escapeForHtml(data));
        });
        process.stdout.on('data', (data) => {
            this.results.push(data);
            pluginFacade_2.renderManager.addContentTo(this.outputId, pluginFacade_3.coreUtil.escapeForHtml(data));
        });
        process.stdout.on('end', async (data) => {
            let message = 'finished';
            if (data) {
                message += ' with ' + data;
            }
            await pluginFacade_2.renderManager.addContentTo(this.outputId, message);
            await this.displayResults();
        });
        await pluginFacade_2.renderManager.setContentTo(this.outputId, 'started<br>');
    }
    async displayResults() {
        if (this.resultsWidget) {
            pluginFacade_3.coreUtil.logWarning('expected resultsWidget not to be set at this state');
            this.resultsWidget.unrender();
        }
        await pluginFacade_2.renderManager.addContentTo(this.outputId, `<div id="${this.getId() + 'Results'}"></div>`);
        this.resultsWidget = new ResultsWidget_1.ResultsWidget(this.getId() + 'Results', this.results, () => this.unrender());
        await this.resultsWidget.render();
    }
}
exports.WizardWidget = WizardWidget;
