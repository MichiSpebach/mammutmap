"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleDecorator = void 0;
const logService_1 = require("./logService");
class ConsoleDecorator {
    constructor(originalConsole) {
        this.originalConsole = originalConsole;
        this.Console = this.originalConsole.Console;
    }
    assert(value, message, ...optionalParams) {
        this.originalConsole.assert(value, message, ...optionalParams);
        if (!value) {
            logService_1.log.logToGui(`Assertion failed: ${message}`, 'orange');
        }
    }
    clear() {
        this.originalConsole.clear();
        logService_1.log.clear();
    }
    count(label) {
        this.originalConsole.count(label);
    }
    countReset(label) {
        this.originalConsole.countReset(label);
    }
    debug(message, ...optionalParams) {
        this.originalConsole.debug(message, ...optionalParams);
        logService_1.log.logToGui(`debug: ${message}`, 'grey');
    }
    dir(obj, options) {
        this.originalConsole.dir(obj, options);
    }
    dirxml(...data) {
        this.originalConsole.dirxml(...data);
    }
    error(message, ...optionalParams) {
        this.originalConsole.error(message, ...optionalParams);
        logService_1.log.logToGui(`error: ${message}`, 'red');
    }
    group(...label) {
        this.originalConsole.group(...label);
    }
    groupCollapsed(...label) {
        this.originalConsole.groupCollapsed(...label);
    }
    groupEnd() {
        this.originalConsole.groupEnd();
    }
    info(message, ...optionalParams) {
        this.originalConsole.info(message, ...optionalParams);
        logService_1.log.logToGui(`info: ${message}`, 'grey');
    }
    log(message, ...optionalParams) {
        this.originalConsole.log(message, ...optionalParams);
        logService_1.log.logToGui(`log: ${message}`, 'grey');
    }
    table(tabularData, properties) {
        this.originalConsole.table(tabularData, properties);
    }
    time(label) {
        this.originalConsole.time(label);
    }
    timeEnd(label) {
        this.originalConsole.timeEnd(label);
    }
    timeLog(label, ...data) {
        this.originalConsole.timeLog(label, ...data);
    }
    timeStamp(label) {
        this.originalConsole.timeStamp(label);
    }
    trace(message, ...optionalParams) {
        this.originalConsole.trace(message, ...optionalParams);
        logService_1.log.logToGui(`trace: ${message}`, 'orange');
    }
    warn(message, ...optionalParams) {
        this.originalConsole.warn(message, ...optionalParams);
        logService_1.log.logToGui(`warning: ${message}`, 'orange');
    }
    profile(label) {
        this.originalConsole.profile(label);
    }
    profileEnd(label) {
        this.originalConsole.profileEnd(label);
    }
}
exports.ConsoleDecorator = ConsoleDecorator;
