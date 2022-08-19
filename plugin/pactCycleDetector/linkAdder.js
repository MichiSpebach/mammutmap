"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLinks = void 0;
const pluginFacade = require("../../dist/pluginFacade");
const util_1 = require("../../dist/util");
async function addLinks(cycles, moduleNamePathDictionary) {
    for (const cycle of cycles) {
        for (let i = 0; i < cycle.involvedModulesChain.length - 1; i++) {
            const fromModuleName = cycle.involvedModulesChain[i];
            const toModuleName = cycle.involvedModulesChain[i + 1];
            const fromPath = moduleNamePathDictionary.get(fromModuleName);
            const toPath = moduleNamePathDictionary.get(toModuleName);
            if (!fromPath) {
                util_1.util.logWarning('could not map module ' + fromModuleName);
                continue;
            }
            if (!toPath) {
                util_1.util.logWarning('could not map module ' + toModuleName);
                continue;
            }
            const rootFolder = pluginFacade.getRootFolder();
            const fromBox = (await pluginFacade.findBoxBySourcePath(fromPath, rootFolder)).boxWatcher;
            if (!fromBox) {
                util_1.util.logWarning('could not find box for fromPath ' + fromPath);
                continue;
            }
            const toBox = (await pluginFacade.findBoxBySourcePath(toPath, rootFolder)).boxWatcher;
            if (!toBox) {
                util_1.util.logWarning('could not find box for toPath ' + toPath);
                continue;
            }
            await pluginFacade.addLink((await fromBox.get()), (await toBox.get()).getSrcPath());
            await fromBox.unwatch();
            await toBox.unwatch();
        }
    }
}
exports.addLinks = addLinks;
