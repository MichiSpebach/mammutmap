"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLinks = void 0;
const pluginFacade = require("../../dist/pluginFacade");
const pluginFacade_1 = require("../../dist/pluginFacade");
async function addLinks(cycles, moduleNamePathDictionary) {
    for (const cycle of cycles) {
        for (let i = 0; i < cycle.involvedModulesChain.length - 1; i++) {
            const fromModuleName = cycle.involvedModulesChain[i];
            const toModuleName = cycle.involvedModulesChain[i + 1];
            const fromPath = moduleNamePathDictionary.get(fromModuleName);
            const toPath = moduleNamePathDictionary.get(toModuleName);
            if (!fromPath) {
                pluginFacade_1.coreUtil.logWarning('could not map module ' + fromModuleName);
                continue;
            }
            if (!toPath) {
                pluginFacade_1.coreUtil.logWarning('could not map module ' + toModuleName);
                continue;
            }
            const rootFolder = pluginFacade.getRootFolder();
            const fromBox = (await pluginFacade.findBoxBySourcePath(fromPath, rootFolder)).boxWatcher;
            if (!fromBox) {
                pluginFacade_1.coreUtil.logWarning('could not find box for fromPath ' + fromPath);
                continue;
            }
            const toBox = (await pluginFacade.findBoxBySourcePath(toPath, rootFolder)).boxWatcher;
            if (!toBox) {
                pluginFacade_1.coreUtil.logWarning('could not find box for toPath ' + toPath);
                continue;
            }
            const result = await pluginFacade.addLink((await fromBox.get()), (await toBox.get()).getSrcPath());
            if (result.link && !result.link.includesTag('part of cycle')) {
                await result.link.addTag('part of cycle');
                if (!result.linkAlreadyExisted) {
                    await result.link.addTag('created and removed by pactCycleDetector'); // use maintanence mechanism as soon as available
                }
            }
            await Promise.all([
                fromBox.unwatch(),
                toBox.unwatch()
            ]);
        }
    }
}
exports.addLinks = addLinks;
