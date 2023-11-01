import { BoxWatcher } from "../../dist/pluginFacade"
import * as pluginFacade from "../../dist/pluginFacade"
import { FileBox, RootFolderBox } from "../../dist/pluginFacade"
import { coreUtil } from "../../dist/pluginFacade"
import { Cycle } from "./Cycle"

export async function addLinks(cycles: Cycle[], moduleNamePathDictionary: Map<string, string>): Promise<void> {
    for (const cycle of cycles) {
        for (let i = 0; i < cycle.involvedModulesChain.length-1; i++) {
            const fromModuleName: string = cycle.involvedModulesChain[i]
            const toModuleName: string = cycle.involvedModulesChain[i+1]
            const fromPath: string|undefined = moduleNamePathDictionary.get(fromModuleName)
            const toPath: string|undefined = moduleNamePathDictionary.get(toModuleName)
            if (!fromPath) {
                coreUtil.logWarning('could not map module '+fromModuleName)
                continue
            }
            if (!toPath) {
                coreUtil.logWarning('could not map module '+toModuleName)
                continue
            }

            const rootFolder: RootFolderBox = pluginFacade.getRootFolder()
            const fromBox: BoxWatcher|undefined = (await pluginFacade.findBoxBySourcePath(fromPath, rootFolder)).boxWatcher
            if (!fromBox) {
                coreUtil.logWarning('could not find box for fromPath '+fromPath)
                continue
            }
            const toBox: BoxWatcher|undefined = (await pluginFacade.findBoxBySourcePath(toPath, rootFolder)).boxWatcher
            if (!toBox) {
                coreUtil.logWarning('could not find box for toPath '+toPath)
                continue
            }

            const result = await pluginFacade.addLink((await fromBox.get()) as FileBox, (await toBox.get()).getSrcPath())
            
            if (result.linkRoute) {
                await Promise.all(result.linkRoute.map(async link => {
                    if (link.includesTag('part of cycle')) {
                        return
                    }
                    await link.addTag('part of cycle')
                    if(!result.linkRouteAlreadyExisted) {
                        await link.addTag('created and removed by pactCycleDetector') // use maintanence mechanism as soon as available
                    }
                }))
            }

            await Promise.all([
                fromBox.unwatch(),
                toBox.unwatch()
            ])
        }
    }
}