import { renderManager } from './RenderManager'
import { util } from './util/util'
import * as indexHtmlIds from './indexHtmlIds'

class LogService {
    private logDebugActivated: boolean = false
    private latestLog: {
        message: string
        color: string
        options?: {allowHtml?: boolean}
        count: number
        id: string
    } | undefined

    public setLogDebugActivated(activated: boolean): void {
        this.logDebugActivated = activated
    }
    
    public debug(message: string, options?: {allowHtml?: boolean}): void {
        if (this.logDebugActivated) {
            this.log('debug: ' + message, 'grey', 'log', options)
        }
    }

    public info(message: string, options?: {allowHtml?: boolean}): void {
        this.log('Info: ' + message, 'grey', 'log', options)
    }

    public warning(message: string, options?: {allowHtml?: boolean}): void {
        this.log('WARNING: ' + message, 'orange', 'trace', options)
    }

    /** @deprecated simply throw new Error(..) instead */
    public errorAndThrow(message: string, options?: {allowHtml?: boolean}): never {
        this.errorWithoutThrow(message, options)
        throw new Error(message)
    }

    public errorWithoutThrow(message: string, options?: {allowHtml?: boolean}): void {
        if (message) { // check so that in case of weird type casts logging errors still work
            message = message.toString().replace(/^Error: /, '')
        }
        this.log('ERROR: ' + message, 'red', 'trace', options)
    }

    private async log(message: string, color: string, mode: 'log'|'trace', options?: {allowHtml?: boolean}): Promise<void> {
        if (mode === 'log') {
            console.log(message)
        } else {
            console.trace(message)
        }
        await this.scheduleLogToGui(message, color, 5, options)
    }

    private async scheduleLogToGui(message: string, color: string, triesLeft: number, options?: {allowHtml?: boolean}): Promise<void> {
        if (renderManager.isReady()) {
            await this.logToGui(message, color, options)
        } else { // happens when called before gui is ready // TODO find better solution
            if (triesLeft > 0) {
                await util.wait(1000)
                message += ' -1s'
                await this.scheduleLogToGui(message, color, triesLeft--)
            } else {
                console.trace('WARNING: failed to print log on gui: '+message+', because gui seems not to load.')
            }
        }
    }
    
    private async logToGui(message: string, color: string, options?: {allowHtml?: boolean}): Promise<void> {
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

}

export const log: LogService = new LogService()