"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cycle = void 0;
const pluginFacade_1 = require("../../dist/pluginFacade");
class Cycle {
    constructor(involvedModulesChain) {
        this.involvedModulesChain = involvedModulesChain;
    }
    static fromString(cycleString) {
        cycleString = cycleString.replace('Cycle{', '');
        cycleString = cycleString.replace('-> ...}', '');
        const moduleNames = cycleString.split('->').map(moduleName => moduleName.trim());
        if (moduleNames.length > 1) {
            moduleNames.push(moduleNames[0]);
        }
        else {
            pluginFacade_1.coreUtil.logWarning(`Expected cycle "${cycleString}" to have at least two elements.`);
        }
        return new Cycle(moduleNames);
    }
}
exports.Cycle = Cycle;
