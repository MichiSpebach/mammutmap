import { RenderPriority, renderManager } from './RenderManager'
import { util } from './util/util'
import * as indexHtmlIds from './indexHtmlIds'
import { ConsoleDecorator } from './ConsoleDecorator'
import { PopupWidget } from './PopupWidget'
import { RenderElement } from './util/RenderElement'
import { Subscribers } from './util/Subscribers'

export let log: LogService // = new LogService() // initialized at end of file

export class LogEntry {
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
    public allLogs: LogEntry[] = []

    public add(log: LogEntry): void {
        this.allLogs.push(log)
    }

    public getAll(): LogEntry[] {
        return this.allLogs
    }

    public getLatest(): LogEntry|undefined {
        return this.allLogs[this.allLogs.length-1]
    }

    public clear(): void {
        this.allLogs = []
    }
}

class LogService {
    private readonly originalConsole: Console
    public readonly logs: Logs = new Logs()
    public readonly onAddLog: Subscribers<LogEntry> = new Subscribers()
    public readonly onClearLog: Subscribers<RenderPriority|undefined> = new Subscribers()
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
        let latestLog: LogEntry|undefined = this.logs.getLatest()
        if (latestLog && latestLog.message === message && latestLog.color === color) {
            latestLog.allowHtml = latestLog.allowHtml ?? options?.allowHtml
            latestLog.count++
        } else {
            latestLog = new LogEntry({message, color, allowHtml: options?.allowHtml, count: 1, id: util.generateId()})
            this.logs.add(latestLog)
        }
        this.onAddLog.callSubscribers(latestLog)
    }

    public async clear(priority?: RenderPriority): Promise<void> {
        this.logs.clear()
        this.onClearLog.callSubscribers(priority)
    }

}

log = new LogService()