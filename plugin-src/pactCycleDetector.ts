import { MenuItem } from 'electron'
import * as applicationMenu from '../dist/applicationMenu'
import { PopupWidget } from '../dist/PopupWidget'
import { renderManager } from '../dist/RenderManager'
import { ChildProcess, util } from '../dist/util'
import * as pluginFacade from '../dist/pluginFacade'
import { FileBox, RootFolderBox } from '../dist/pluginFacade'
import { BoxWatcher } from '../dist/box/BoxWatcher'
import { Widget } from '../dist/Widget'

applicationMenu.addMenuItemTo('pactCycleDetector.js', new MenuItem({label: 'detect...', click: openWizard}))

async function openWizard(): Promise<void> {
    new WizardWidget().render()
}

class WizardWidget extends PopupWidget {

    private readonly commandInputId = this.getId()+'CommandInput'
    private readonly commandSubmitId = this.getId()+'CommandSubmit'
    private readonly outputId = this.getId()+'Output'

    private results: string[] = []

    private resultsWidget: ResultsWidget|undefined

    public constructor() {
        super('pactCycleDetectorWizard', 'Pact Cycle Detector')
    }

    protected formContentHtml(): string {
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
        let process: ChildProcess
        try {
            process = util.runShellCommand(command)
        } catch (e: any) {
            await renderManager.addContentTo(this.outputId, 'Error: '+util.escapeForHtml(e.toString()))
            return
        }
        if (!process.stdout) {
            await renderManager.addContentTo(this.outputId, 'Error: process has no stdout.')
            return
        }

        process.stdout.on('error', (data: string) => {
            renderManager.addContentTo(this.outputId, util.escapeForHtml(data))
        })
        process.stdout.on('data', (data: string) => {
            this.results.push(data)
            renderManager.addContentTo(this.outputId, util.escapeForHtml(data))
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
            util.logWarning('expected resultsWidget not to be set at this state')
            this.resultsWidget.unrender()
        }
        await renderManager.addContentTo(this.outputId, `<div id="${this.getId()+'Results'}"></div>`)
        this.resultsWidget = new ResultsWidget(this.getId()+'Results', this.results, () => this.unrender())
        await this.resultsWidget.render()
    }

}

class ResultsWidget extends Widget {
    private readonly id: string
    private readonly results: string[]
    private readonly afterSubmit: () => Promise<void>

    public constructor(id: string, results: string[], afterSubmit: () => Promise<void>) {
        super ()
        this.id = id
        this.results = results
        this.afterSubmit = afterSubmit
    }

    public getId(): string {
        return this.id
    }

    private getPathInputIdPrefix(): string {
        return this.getId()+'PathInput'
    }

    private getResultsSubmitId(): string {
        return this.getId()+'Submit'
    }

    public async render(): Promise<void> {
        let cycleStrings: string[] = []
        for (const result of this.results) {
            cycleStrings = cycleStrings.concat(result.trim().split('\n'))
        }

        const cycles: Cycle[] = cycleStrings.map(cycleString => Cycle.fromString(cycleString))

        await this.renderCycles(cycles)
        await this.renderResultsMapTable(cycles)
    }

    private async renderCycles(cycles: Cycle[]): Promise<void> {
        await renderManager.addContentTo(this.getId(), '<br>')
        let cyclesHtml: string = '<details>'
        cyclesHtml += '<summary>cycles</summary>'
        for (const cycle of cycles) {
            cyclesHtml += util.escapeForHtml(cycle.involvedModulesChain.toString())+'<br>'
        }
        cyclesHtml += '</details>'
        await renderManager.addContentTo(this.getId(), cyclesHtml)
    }

    private async renderResultsMapTable(cycles: Cycle[]): Promise<void> {
        const uniqueModuleNames: string[] = extractUniqueModuleNames(cycles)
        let tableHtml: string = '<table>'
        tableHtml += '<tr> <th>moduleName</th> <th>path<th> </tr>'
        for (const uniqueModuleName of uniqueModuleNames) {
            tableHtml += `<tr> <td>${uniqueModuleName}</td> <td><input id="${this.getPathInputIdPrefix()+uniqueModuleName}" value="${uniqueModuleName}"></td> </tr>`
        }
        tableHtml += '</table>'
        await renderManager.addContentTo(this.getId(), tableHtml)
        await renderManager.addContentTo(this.getId(), `<button id ="${this.getResultsSubmitId()}">submit and add links</button>`)
        await renderManager.addEventListenerTo(this.getResultsSubmitId(), 'click', async () => {
            const moduleNamePathDictionary: Map<string, string> = new Map()
            for (const uniqueModuleName of uniqueModuleNames) {
                moduleNamePathDictionary.set(uniqueModuleName, await renderManager.getValueOf(this.getPathInputIdPrefix()+uniqueModuleName))
            }
            await addLinks(cycles, moduleNamePathDictionary)
            await this.afterSubmit()
        })
    }

    public async unrender(): Promise<void> {
        await renderManager.removeEventListenerFrom(this.getResultsSubmitId(), 'click')
        await renderManager.setContentTo(this.getId(), '')
    }
    
}

function extractUniqueModuleNames(cycles: Cycle[]): string[] {
    const uniqueModuleNames: string[] = []
    for (const cycle of cycles) {
        for (const moduleName of cycle.involvedModulesChain) {
            if (!uniqueModuleNames.includes(moduleName)) {
                uniqueModuleNames.push(moduleName)
            }
        }
    }
    return uniqueModuleNames
}

class Cycle {
    public readonly involvedModulesChain: string[]

    public static fromString(cycleString: string): Cycle {
        cycleString = cycleString.replace('Cycle{', '')
        cycleString = cycleString.replace('-> ...}', '')
        const moduleNames: string[] = cycleString.split('->').map(moduleName => moduleName.trim())
        if (moduleNames.length > 1) {
            moduleNames.push(moduleNames[0])
        } else {
            util.logWarning(`Expected cycle "${cycleString}" to have at least two elements.`)
        }
        return new Cycle(moduleNames)
    }
    
    public constructor(involvedModulesChain: string[]) {
        this.involvedModulesChain = involvedModulesChain
    }
}

async function addLinks(cycles: Cycle[], moduleNamePathDictionary: Map<string, string>): Promise<void> {
    for (const cycle of cycles) {
        for (let i = 0; i < cycle.involvedModulesChain.length-1; i++) {
            const fromModuleName: string = cycle.involvedModulesChain[i]
            const toModuleName: string = cycle.involvedModulesChain[i+1]
            const fromPath: string|undefined = moduleNamePathDictionary.get(fromModuleName)
            const toPath: string|undefined = moduleNamePathDictionary.get(toModuleName)
            if (!fromPath) {
                util.logWarning('could not map module '+fromModuleName)
                continue
            }
            if (!toPath) {
                util.logWarning('could not map module '+toModuleName)
                continue
            }

            const rootFolder: RootFolderBox = pluginFacade.getRootFolder()
            const fromBox: BoxWatcher|undefined = (await pluginFacade.findBoxBySourcePath(fromPath, rootFolder)).boxWatcher
            if (!fromBox) {
                util.logWarning('could not find box for fromPath '+fromPath)
                continue
            }
            const toBox: BoxWatcher|undefined = (await pluginFacade.findBoxBySourcePath(toPath, rootFolder)).boxWatcher
            if (!toBox) {
                util.logWarning('could not find box for toPath '+toPath)
                continue
            }

            await pluginFacade.addLink((await fromBox.get()) as FileBox, (await toBox.get()).getSrcPath())
            await fromBox.unwatch()
            await toBox.unwatch()
        }
    }
}