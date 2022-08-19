import { util } from '../../dist/util'

export class Cycle {
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