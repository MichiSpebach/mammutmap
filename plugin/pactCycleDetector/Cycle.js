"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cycle = void 0;
const util_1 = require("../../dist/util");
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
            util_1.util.logWarning(`Expected cycle "${cycleString}" to have at least two elements.`);
        }
        return new Cycle(moduleNames);
    }
}
exports.Cycle = Cycle;
