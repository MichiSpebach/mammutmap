import { RenderPriority, renderManager } from './RenderManager'
import { util } from './util/util'
import * as indexHtmlIds from './indexHtmlIds'
import { ConsoleDecorator } from './ConsoleDecorator'
import { PopupWidget } from './PopupWidget'
import { RenderElement } from './util/RenderElement'

export let log: LogService // = new LogService() // initialized at end of file

class Log {
    public readonly id: string
    public readonly message: string
    public readonly color: string
    public allowHtml: boolean|undefined
    public count: number

    /*public constructor({ I want something like this to work
        public readonly id: string,
        public readonly message: string,
        public readonly color: string,
        public allowHtml?: boolean,
        public count: number
    }) {}*/
    public constructor(options: {id: string, message: string, color: string, allowHtml?: boolean, count: number}) {
        this.id = options.id
        this.message = options.message
        this.color = options.color
        this.allowHtml = options.allowHtml
        this.count = options.count
    }

    public toHtmlString(): string {
        let htmlMessage: string = this.allowHtml ? this.message : util.escapeForHtml(this.message)
        if (this.count > 1) {
            htmlMessage += ` (${this.count})`
        }
        return htmlMessage
    }

    public toRenderElement(): RenderElement {
        return {
            type: 'div',
            id: this.id,
            style: {color: this.color},
            innerHTML: this.toHtmlString()
        }
    }
}

class Logs {
    private allLogs: Log[] = []
    private logsToDisplay: Log[] = []

    public add(log: Log): void {
        this.allLogs.push(log)
        this.logsToDisplay.push(log)
    }

    public getAll(): Log[] {
        return this.allLogs
    }

    public getLatest(): Log|undefined {
        return this.logsToDisplay[this.logsToDisplay.length-1]
    }

    public getAndRemoveOldestToDisplay(): Log[] {
        const toRemove: Log[] = []
        while (this.logsToDisplay.length > 50) {
            toRemove.push(this.logsToDisplay.shift()!)
        }
        return toRemove
    }

    public clear(): void {
        this.allLogs = []
        this.logsToDisplay = []
    }
}

class LogService {
    private readonly originalConsole: Console
    private readonly logs: Logs = new Logs()
    private readonly showAllLogsButtonId: string = indexHtmlIds.logId+'ShowAllLogs'
    private showAllLogsButtonState: 'notInitialized'|'notDisplayed'|'displayed' = 'notInitialized'
    private logDebugActivated: boolean = false

    public constructor() {
        this.originalConsole = console
        console = new ConsoleDecorator(console)
    }

    public setLogDebugActivated(activated: boolean): void {
        this.logDebugActivated = activated
    }
    
    public debug(message: string, options?: {allowHtml?: boolean}): void {
        if (this.logDebugActivated) {
            this.originalConsole.debug(message)
            this.logToGui('debug: ' + message, 'grey', options)
        }
    }

    public info(message: string, options?: {allowHtml?: boolean}): void {
        this.originalConsole.info(message)
        this.logToGui('Info: ' + message, 'grey', options)
    }

    public warning(message: string, options?: {allowHtml?: boolean}): void {
        //this.originalConsole.warn(message) TODO: this would be nicer than trace but does not log a stacktrace
        this.originalConsole.trace('WARNING: '+message)
        this.logToGui('WARNING: '+message, 'orange', options)
    }

    /** @deprecated simply throw new Error(..) instead */
    public errorAndThrow(message: string, options?: {allowHtml?: boolean}): never {
        this.errorWithoutThrow(message, options)
        throw new Error(message)
    }

    public errorWithoutThrow(message: string, options?: {allowHtml?: boolean}): void {
        //this.originalConsole.error(message) TODO: this would be nicer than trace but does not log a stacktrace
        this.originalConsole.trace('ERROR: '+message)
        if (message) { // check so that in case of weird type casts logging errors still work
            message = message.toString().replace(/^Error: /, '')
        }
        this.logToGui('ERROR: '+message, 'red', options)
    }

    public async logToGui(message: string, color: string, options?: {allowHtml?: boolean}): Promise<void> {
        await this.scheduleLogToGui(message, color, 5, options)
    }

    private async scheduleLogToGui(message: string, color: string, triesLeft: number, options?: {allowHtml?: boolean}): Promise<void> {
        if (renderManager.isReady()) {
            await this.executeLogToGui(message, color, options)
        } else { // happens when called before gui is ready // TODO find better solution
            if (triesLeft > 0) {
                await util.wait(1000)
                message += ' -1s'
                await this.scheduleLogToGui(message, color, triesLeft--)
            } else {
                this.originalConsole.trace('WARNING: failed to print log on gui: '+message+', because gui seems not to load.')
            }
        }
    }
    
    private async executeLogToGui(message: string, color: string, options?: {allowHtml?: boolean}): Promise<void> {
        if (this.showAllLogsButtonState === 'notInitialized') {
            this.showAllLogsButtonState = 'notDisplayed'
            await renderManager.addElementTo(indexHtmlIds.logId, {
                type: 'button',
                id: this.showAllLogsButtonId,
                style: {display: 'none'},
                onclick: () => PopupWidget.buildAndRender('All Logs', this.logs.getAll().map(log => log.toRenderElement())),
                children: 'Show All Logs',
            })
        }

        let latestLog: Log|undefined = this.logs.getLatest()
        if (latestLog && latestLog.message === message && latestLog.color === color) {
            latestLog.allowHtml = latestLog.allowHtml ?? options?.allowHtml
            latestLog.count++
        } else {
            latestLog = new Log({message, color, allowHtml: options?.allowHtml, count: 1, id: util.generateId()})
            this.logs.add(latestLog)
        }

        if (latestLog.count > 1) {
            await renderManager.setContentTo(latestLog.id, latestLog.toHtmlString())
        } else {
            await renderManager.addElementTo(indexHtmlIds.logId, latestLog.toRenderElement())
        }
        await renderManager.scrollToBottom(indexHtmlIds.terminalId)
        this.removeOldLogsFromGui()
    }

    private async removeOldLogsFromGui(): Promise<void> {
        const logsToRemove: Log[] = this.logs.getAndRemoveOldestToDisplay()
        const pros: Promise<void>[] = logsToRemove.map(log => renderManager.remove(log.id))
        if (logsToRemove.length > 0 ) {
            renderManager.setStyleTo(this.showAllLogsButtonId, {display: 'inline-block'})
        }
        await Promise.all(pros)
    }

    public async clear(priority?: RenderPriority): Promise<void> {
        this.logs.clear()
        await renderManager.clearContentOf(indexHtmlIds.logId, priority)
    }

}

log = new LogService()