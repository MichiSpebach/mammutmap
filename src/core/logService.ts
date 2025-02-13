import { RenderPriority } from './renderEngine/renderManager'
import { util } from './util/util'
import { ConsoleDecorator } from './ConsoleDecorator'
import { RenderElement } from './renderEngine/RenderElement'
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
            style: {color: this.color, whiteSpace: 'pre'},
            innerHTML: this.toHtmlString()
        }
    }
}

class LogService {
    public readonly onAddLog: Subscribers<LogEntry> = new Subscribers()
    public readonly onClearLog: Subscribers<RenderPriority|undefined> = new Subscribers()
    private readonly originalConsole: Console
    private logs: LogEntry[] = []
    private logDebugActivated: boolean = false

    public constructor() {
        this.originalConsole = console
        console = new ConsoleDecorator(console)
    }

    public getLogs(): Readonly<LogEntry[]> {
        return this.logs
    }

    public setLogDebugActivated(activated: boolean): void {
        this.logDebugActivated = activated
    }
    
    public debug(message: string, options?: {allowHtml?: boolean}): void {
        if (this.logDebugActivated) {
            this.originalConsole.debug(message)
            this.storeLogAndCallSubscribers('debug: ' + message, 'grey', options)
        }
    }

    public info(message: string, options?: {allowHtml?: boolean}): void {
        this.originalConsole.info(message)
        this.storeLogAndCallSubscribers('Info: ' + message, 'grey', options)
    }

    public warning(message: string, options?: {allowHtml?: boolean}): void {
        //this.originalConsole.warn(message) TODO: this would be nicer than trace but does not log a stacktrace
        this.originalConsole.trace('WARNING: '+message)
        this.storeLogAndCallSubscribers('WARNING: '+message, 'orange', options)
    }

    /** @deprecated simply throw new Error(..) instead, but options would not be supported */
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
        this.storeLogAndCallSubscribers('ERROR: '+message, 'red', options)
    }

    public async storeLogAndCallSubscribers(message: string, color: string, options?: {allowHtml?: boolean}): Promise<void> {
        let latestLog: LogEntry|undefined = this.logs[this.logs.length-1]
        if (latestLog && latestLog.message === message && latestLog.color === color) {
            latestLog.allowHtml = latestLog.allowHtml ?? options?.allowHtml
            latestLog.count++
        } else {
            latestLog = new LogEntry({message, color, allowHtml: options?.allowHtml, count: 1, id: util.generateId()})
            this.logs.push(latestLog)
        }
        await this.onAddLog.callSubscribers(latestLog)
    }

    public async clear(priority?: RenderPriority): Promise<void> {
        this.logs = []
        this.onClearLog.callSubscribers(priority)
    }

}

log = new LogService()