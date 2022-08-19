import { renderManager } from "../../dist/RenderManager"
import { util } from "../../dist/util"
import { Widget } from "../../dist/Widget"
import { Cycle } from "./Cycle"
import * as linkAdder from "./linkAdder"

export class ResultsWidget extends Widget {
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
        let cyclesHtml: string = '<details>'
        cyclesHtml += '<summary>cycles</summary>'
        for (const cycle of cycles) {
            cyclesHtml += util.escapeForHtml(cycle.involvedModulesChain.toString())+'<br>'
        }
        cyclesHtml += '</details>'
        await renderManager.addContentTo(this.getId(), cyclesHtml)
    }

    private async renderResultsMapTable(cycles: Cycle[]): Promise<void> {
        const uniqueModuleNames: string[] = this.extractUniqueModuleNames(cycles)
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
            await linkAdder.addLinks(cycles, moduleNamePathDictionary)
            await this.afterSubmit()
        })
    }

    private extractUniqueModuleNames(cycles: Cycle[]): string[] {
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

    public async unrender(): Promise<void> {
        await renderManager.removeEventListenerFrom(this.getResultsSubmitId(), 'click')
        await renderManager.setContentTo(this.getId(), '')
    }
    
}