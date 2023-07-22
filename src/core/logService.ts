import { RenderPriority, renderManager } from './RenderManager'
import { util } from './util/util'
import * as indexHtmlIds from './indexHtmlIds'
import { ConsoleDecorator } from './ConsoleDecorator'

export let log: LogService // = new LogService() // initialized at end of file

class LogService {
    private readonly originalConsole: Console
    private logDebugActivated: boolean = false
    private latestLog: {
        message: string
        color: string
        options?: {allowHtml?: boolean}
        count: number
        id: string
    } | undefined

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
        this.originalConsole.warn(message)
        this.logToGui('WARNING: ' + message, 'orange', options)
    }

    /** @deprecated simply throw new Error(..) instead */
    public errorAndThrow(message: string, options?: {allowHtml?: boolean}): never {
        this.errorWithoutThrow(message, options)
        throw new Error(message)
    }

    public errorWithoutThrow(message: string, options?: {allowHtml?: boolean}): void {
        this.originalConsole.error(message)
        if (message) { // check so that in case of weird type casts logging errors still work
            message = message.toString().replace(/^Error: /, '')
        }
        this.logToGui('ERROR: ' + message, 'red', options)
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
        if (this.latestLog && this.latestLog.message === message && this.latestLog.color === color) {
            if (this.latestLog.options) {
                this.latestLog.options.allowHtml = this.latestLog.options.allowHtml ?? options?.allowHtml
            } else {
                this.latestLog.options = options
            }
            this.latestLog.count++
        } else {
            this.latestLog = {message, color, options, count: 1, id: util.generateId()}
        }

        let finalMessage: string = this.latestLog.options?.allowHtml ? message : util.escapeForHtml(message)
        if (this.latestLog.count > 1) {
            finalMessage += ` (${this.latestLog.count})`
            await renderManager.setContentTo(this.latestLog.id, finalMessage)
        } else {
            await renderManager.addElementTo(indexHtmlIds.logId, {
                type: 'div',
                id: this.latestLog.id,
                style: {color: this.latestLog.color},
                innerHTML: finalMessage
            })
        }
        await renderManager.scrollToBottom(indexHtmlIds.terminalId)
    }

    public async clear(priority?: RenderPriority): Promise<void> {
        this.latestLog = undefined
        await renderManager.clearContentOf(indexHtmlIds.logId, priority)
    }

}

log = new LogService()