"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log = void 0;
const RenderManager_1 = require("./RenderManager");
const util_1 = require("./util/util");
const indexHtmlIds = require("./indexHtmlIds");
const ConsoleDecorator_1 = require("./ConsoleDecorator");
const PopupWidget_1 = require("./PopupWidget");
class Log {
    /*public constructor({ I want something like this to work
        public readonly id: string,
        public readonly message: string,
        public readonly color: string,
        public allowHtml?: boolean,
        public count: number
    }) {}*/
    constructor(options) {
        this.id = options.id;
        this.message = options.message;
        this.color = options.color;
        this.allowHtml = options.allowHtml;
        this.count = options.count;
    }
    toHtmlString() {
        let htmlMessage = this.allowHtml ? this.message : util_1.util.escapeForHtml(this.message);
        if (this.count > 1) {
            htmlMessage += ` (${this.count})`;
        }
        return htmlMessage;
    }
    toRenderElement() {
        return {
            type: 'div',
            id: this.id,
            style: { color: this.color },
            innerHTML: this.toHtmlString()
        };
    }
}
class Logs {
    constructor() {
        this.allLogs = [];
        this.logsToDisplay = [];
    }
    add(log) {
        this.allLogs.push(log);
        this.logsToDisplay.push(log);
    }
    getAll() {
        return this.allLogs;
    }
    getLatest() {
        return this.logsToDisplay[this.logsToDisplay.length - 1];
    }
    getAndRemoveOldestToDisplay() {
        const toRemove = [];
        while (this.logsToDisplay.length > 50) {
            toRemove.push(this.logsToDisplay.shift());
        }
        return toRemove;
    }
    clear() {
        this.allLogs = [];
        this.logsToDisplay = [];
    }
}
class LogService {
    constructor() {
        this.logs = new Logs();
        this.showAllLogsButtonId = indexHtmlIds.logId + 'ShowAllLogs';
        this.showAllLogsButtonState = 'notInitialized';
        this.logDebugActivated = false;
        this.originalConsole = console;
        console = new ConsoleDecorator_1.ConsoleDecorator(console);
    }
    setLogDebugActivated(activated) {
        this.logDebugActivated = activated;
    }
    debug(message, options) {
        if (this.logDebugActivated) {
            this.originalConsole.debug(message);
            this.logToGui('debug: ' + message, 'grey', options);
        }
    }
    info(message, options) {
        this.originalConsole.info(message);
        this.logToGui('Info: ' + message, 'grey', options);
    }
    warning(message, options) {
        //this.originalConsole.warn(message) TODO: this would be nicer than trace but does not log a stacktrace
        this.originalConsole.trace('WARNING: ' + message);
        this.logToGui('WARNING: ' + message, 'orange', options);
    }
    /** @deprecated simply throw new Error(..) instead */
    errorAndThrow(message, options) {
        this.errorWithoutThrow(message, options);
        throw new Error(message);
    }
    errorWithoutThrow(message, options) {
        //this.originalConsole.error(message) TODO: this would be nicer than trace but does not log a stacktrace
        this.originalConsole.trace('ERROR: ' + message);
        if (message) { // check so that in case of weird type casts logging errors still work
            message = message.toString().replace(/^Error: /, '');
        }
        this.logToGui('ERROR: ' + message, 'red', options);
    }
    async logToGui(message, color, options) {
        await this.scheduleLogToGui(message, color, 5, options);
    }
    async scheduleLogToGui(message, color, triesLeft, options) {
        if (RenderManager_1.renderManager.isReady()) {
            await this.executeLogToGui(message, color, options);
        }
        else { // happens when called before gui is ready // TODO find better solution
            if (triesLeft > 0) {
                await util_1.util.wait(1000);
                message += ' -1s';
                await this.scheduleLogToGui(message, color, triesLeft--);
            }
            else {
                this.originalConsole.trace('WARNING: failed to print log on gui: ' + message + ', because gui seems not to load.');
            }
        }
    }
    async executeLogToGui(message, color, options) {
        if (this.showAllLogsButtonState === 'notInitialized') {
            this.showAllLogsButtonState = 'notDisplayed';
            await RenderManager_1.renderManager.addElementTo(indexHtmlIds.logId, {
                type: 'button',
                id: this.showAllLogsButtonId,
                style: { display: 'none' },
                onclick: () => PopupWidget_1.PopupWidget.buildAndRender('All Logs', this.logs.getAll().map(log => log.toRenderElement())),
                children: 'Show All Logs',
            });
        }
        let latestLog = this.logs.getLatest();
        if (latestLog && latestLog.message === message && latestLog.color === color) {
            latestLog.allowHtml = latestLog.allowHtml ?? options?.allowHtml;
            latestLog.count++;
        }
        else {
            latestLog = new Log({ message, color, allowHtml: options?.allowHtml, count: 1, id: util_1.util.generateId() });
            this.logs.add(latestLog);
        }
        if (latestLog.count > 1) {
            await RenderManager_1.renderManager.setContentTo(latestLog.id, latestLog.toHtmlString());
        }
        else {
            await RenderManager_1.renderManager.addElementTo(indexHtmlIds.logId, latestLog.toRenderElement());
        }
        await RenderManager_1.renderManager.scrollToBottom(indexHtmlIds.terminalId);
        this.removeOldLogsFromGui();
    }
    async removeOldLogsFromGui() {
        const logsToRemove = this.logs.getAndRemoveOldestToDisplay();
        const pros = logsToRemove.map(log => RenderManager_1.renderManager.remove(log.id));
        if (logsToRemove.length > 0) {
            RenderManager_1.renderManager.setStyleTo(this.showAllLogsButtonId, { display: 'inline-block' });
        }
        await Promise.all(pros);
    }
    async clear(priority) {
        this.logs.clear();
        await RenderManager_1.renderManager.clearContentOf(indexHtmlIds.logId, priority);
    }
}
exports.log = new LogService();
