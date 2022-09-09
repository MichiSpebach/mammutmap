import { BoxWatcher } from "../../dist/box/BoxWatcher"
import * as pluginFacade from "../../dist/pluginFacade"
import { FileBox, RootFolderBox } from "../../dist/pluginFacade"
import { util } from "../../dist/util"
import { Cycle } from "./Cycle"

export async function addLinks(cycles: Cycle[], moduleNamePathDictionary: Map<string, string>): Promise<void> {
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

            const result = await pluginFacade.addLink((await fromBox.get()) as FileBox, (await toBox.get()).getSrcPath())
            
            if (result.link && !result.link.includesTag('part of cycle')) {
                await result.link.addTag('part of cycle')
                if(!result.linkAlreadyExisted) {
                    await result.link.addTag('created and removed by pactCycleDetector') // use maintanence mechanism as soon as available
                }
            }

            await Promise.all([
                fromBox.unwatch(),
                toBox.unwatch()
            ])
        }
    }
}