import { PopupWidget } from "../../dist/pluginFacade"
import { renderManager } from "../../dist/pluginFacade"
import { ChildProcess, coreUtil } from "../../dist/pluginFacade"
import { ChildProcess as NodeChildProcess } from "child_process"
import { ResultsWidget } from "./ResultsWidget"

export class WizardWidget extends PopupWidget {

    private readonly commandInputId = this.getId()+'CommandInput'
    private readonly commandSubmitId = this.getId()+'CommandSubmit'
    private readonly outputId = this.getId()+'Output'

    private results: string[] = []

    private resultsWidget: ResultsWidget|undefined

    public constructor() {
        super('pactCycleDetectorWizard', 'Pact Cycle Detector')
    }

    protected formContent(): string {
        let html = 'Command:<br>'
        html += `<input id="${this.commandInputId}" value="java -jar <path to jar>" autofocus>`
        html += `<button id="${this.commandSubmitId}">run</button>`
        html += '<br>'
        html += `<div id="${this.outputId}"></div>`
        return html
    }

    protected async afterRender(): Promise<void> {
        await renderManager.addEventListenerTo(this.commandSubmitId, 'click', () => this.runCommand())
    }

    protected async beforeUnrender(): Promise<void> {
        await renderManager.removeEventListenerFrom(this.commandSubmitId, 'click')
        await this.resultsWidget?.unrender()
    }

    private async runCommand(): Promise<void> {
        this.results = []
        await this.resultsWidget?.unrender()
        this.resultsWidget = undefined

        const command: string = await renderManager.getValueOf(this.commandInputId)
        let process: NodeChildProcess
        try {
            process = coreUtil.runShellCommand(command) as NodeChildProcess
        } catch (e: any) {
            await renderManager.addContentTo(this.outputId, 'Error: '+coreUtil.escapeForHtml(e.toString()))
            return
        }
        if (!process.stdout) {
            await renderManager.addContentTo(this.outputId, 'Error: process has no stdout.')
            return
        }

        process.stdout.on('error', (data: string) => {
            renderManager.addContentTo(this.outputId, coreUtil.escapeForHtml(data))
        })
        process.stdout.on('data', (data: string) => {
            this.results.push(data)
            renderManager.addContentTo(this.outputId, coreUtil.escapeForHtml(data))
        })
        process.stdout.on('end', async (data: string) => {
            let message: string = 'finished'
            if (data) {
                message += ' with '+data
            }
            await renderManager.addContentTo(this.outputId, message)
            await this.displayResults()
        })

        await renderManager.setContentTo(this.outputId, 'started<br>')
    }

    private async displayResults(): Promise<void> {
        if (this.resultsWidget) {
            coreUtil.logWarning('expected resultsWidget not to be set at this state')
            this.resultsWidget.unrender()
        }
        await renderManager.addContentTo(this.outputId, `<div id="${this.getId()+'Results'}"></div>`)
        this.resultsWidget = new ResultsWidget(this.getId()+'Results', this.results, () => this.unrender())
        await this.resultsWidget.render()
    }

}