import { MenuItem } from 'electron'
import * as applicationMenu from '../dist/applicationMenu'
import { PopupWidget } from '../dist/PopupWidget'
import { renderManager } from '../dist/RenderManager'
import { ChildProcess, util } from '../dist/util'
import * as pluginFacade from '../dist/pluginFacade'
import { Box, FileBox, RootFolderBox } from '../dist/pluginFacade'
import { BoxWatcher } from '../dist/box/BoxWatcher'

applicationMenu.addMenuItemTo('pactCycleDetector.js', new MenuItem({label: 'detect...', click: openWizard}))

async function openWizard(): Promise<void> {
    new Wizard().render()
}

class Wizard extends PopupWidget {

    private readonly commandInputId = this.getId()+'CommandInput'
    private readonly commandSubmitId = this.getId()+'CommandSubmit'
    private readonly outputId = this.getId()+'Output'
    private readonly pathInputIdPrefix = this.getId()+'PathInput'
    private readonly resultsSubmitId = this.getId()+'ResultsSubmit'

    private beforeUnrenderTasks: (() => Promise<void>)[] = []

    private results: string[] = []

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
        await Promise.all(this.beforeUnrenderTasks.map(task => task()))
    }

    private async runCommand(): Promise<void> {
        const command: string = await renderManager.getValueOf(this.commandInputId)
        let process: ChildProcess
        try {
            process = util.runShellCommand(command)
        } catch (e: any) {
            await renderManager.addContentTo(this.outputId, 'Error: '+util.escapeForHtml(e.toString()))
            return
        }
        if (!process.stdout) {
            await renderManager.setContentTo(this.outputId, 'Error: process has no stdout.')
            return
        }

        process.stdout.on('error', (data: string) => {
            renderManager.addContentTo(this.outputId, util.escapeForHtml(data))
        })
        process.stdout.on('data', (data: string) => {
            this.results.push(data)
            renderManager.addContentTo(this.outputId, util.escapeForHtml(data))
        })
        process.stdout.on('end', (data: string) => {
            let message: string = 'finished'
            if (data) {
                message += ' with '+data
            }
            renderManager.addContentTo(this.outputId, message)
            this.displayResults()
        })

        await renderManager.setContentTo(this.outputId, 'started<br>')
    }

    private async displayResults(): Promise<void> {
        let cycleStrings: string[] = []
        for (const result of this.results) {
            cycleStrings = cycleStrings.concat(result.trim().split('\n'))
        }

        const cycles: Cycle[] = cycleStrings.map(cycleString => Cycle.fromString(cycleString))

        await this.displayCycles(cycles)
        await this.displayResultsMapTable(cycles)
    }

    private async displayCycles(cycles: Cycle[]): Promise<void> {
        await renderManager.addContentTo(this.outputId, '<br>')
        let cyclesHtml: string = '<details>'
        cyclesHtml += '<summary>cycles</summary>'
        for (const cycle of cycles) {
            cyclesHtml += util.escapeForHtml(cycle.involvedModulesChain.toString())+'<br>'
        }
        cyclesHtml += '</details>'
        await renderManager.addContentTo(this.outputId, cyclesHtml)
    }

    private async displayResultsMapTable(cycles: Cycle[]): Promise<void> {
        const uniqueModuleNames: string[] = extractUniqueModuleNames(cycles)
        let tableHtml: string = '<table>'
        tableHtml += '<tr> <th>moduleName</th> <th>path<th> </tr>'
        for (const uniqueModuleName of uniqueModuleNames) {
            tableHtml += `<tr> <td>${uniqueModuleName}</td> <td><input id="${this.pathInputIdPrefix+uniqueModuleName}" value="${uniqueModuleName}"></td> </tr>`
        }
        tableHtml += '</table>'
        await renderManager.addContentTo(this.outputId, tableHtml)
        await renderManager.addContentTo(this.outputId, `<button id ="${this.resultsSubmitId}">submit and add links</button>`)
        await renderManager.addEventListenerTo(this.resultsSubmitId, 'click', async () => {
            const moduleNamePathDictionary: Map<string, string> = new Map()
            for (const uniqueModuleName of uniqueModuleNames) {
                moduleNamePathDictionary.set(uniqueModuleName, await renderManager.getValueOf(this.pathInputIdPrefix+uniqueModuleName))
            }
            await addLinks(cycles, moduleNamePathDictionary)
        })
        this.beforeUnrenderTasks.push(() => renderManager.removeEventListenerFrom(this.resultsSubmitId, 'click'))
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
            const fromBox: BoxWatcher|undefined = (await rootFolder.getBoxBySourcePathAndRenderIfNecessary(fromPath)).boxWatcher
            if (!fromBox) {
                util.logWarning('could not find box for fromPath '+fromPath)
                continue
            }
            const toBox: BoxWatcher|undefined = (await rootFolder.getBoxBySourcePathAndRenderIfNecessary(toPath)).boxWatcher
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