import { RenderPriority, renderManager } from './RenderManager'
import { util } from './util/util'
import * as indexHtmlIds from './indexHtmlIds'
import { ConsoleDecorator } from './ConsoleDecorator'

export let log: LogService // = new LogService() // initialized at end of file

type Log = {
    message: string
    color: string
    options?: {allowHtml?: boolean}
    count: number
    id: string
}

class Logs {
    private allLogs: Log[] = []
    private logsToDisplay: Log[] = []

    public add(log: Log): void {
        this.allLogs.push(log)
        this.logsToDisplay.push(log)
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
        let latestLog: Log|undefined = this.logs.getLatest()
        if (latestLog && latestLog.message === message && latestLog.color === color) {
            if (latestLog.options) {
                latestLog.options.allowHtml = latestLog.options.allowHtml ?? options?.allowHtml
            } else {
                latestLog.options = options
            }
            latestLog.count++
        } else {
            latestLog = {message, color, options, count: 1, id: util.generateId()}
            this.logs.add(latestLog)
        }

        let finalMessage: string = latestLog.options?.allowHtml ? message : util.escapeForHtml(message)
        if (latestLog.count > 1) {
            finalMessage += ` (${latestLog.count})`
            await renderManager.setContentTo(latestLog.id, finalMessage)
        } else {
            await renderManager.addElementTo(indexHtmlIds.logId, {
                type: 'div',
                id: latestLog.id,
                style: {color: latestLog.color},
                innerHTML: finalMessage
            })
        }
        await renderManager.scrollToBottom(indexHtmlIds.terminalId)
        this.removeOldLogsFromGui()
    }

    private async removeOldLogsFromGui(): Promise<void> {
        const logsToRemove: Log[] = this.logs.getAndRemoveOldestToDisplay()
        const pros: Promise<void>[] = logsToRemove.map(log => renderManager.remove(log.id))
        await Promise.all(pros)
    }

    public async clear(priority?: RenderPriority): Promise<void> {
        this.logs.clear()
        await renderManager.clearContentOf(indexHtmlIds.logId, priority)
    }

}

log = new LogService()