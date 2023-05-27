import { renderManager } from './RenderManager'
import { util } from './util/util'

class LogService {
    private logDebugActivated: boolean = false

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
        await this.logToGui(message, color, 5, options)
    }

    private async logToGui(message: string, color: string, triesLeft: number, options?: {allowHtml?: boolean}): Promise<void> {
        const finalMessage: string = options?.allowHtml ? message : util.escapeForHtml(message)
        const division: string = '<div style="color:' + color + '">'+finalMessage+'</div>'
        if (renderManager.isReady()) {
            await renderManager.addContentTo('log', division)
            await renderManager.scrollToBottom('terminal')
        } else { // happens when called before gui is ready // TODO find better solution
            if (triesLeft > 0) {
            await util.wait(1000)
            message += ' -1s'
            await this.logToGui(message, color, triesLeft--)
            } else {
            console.trace('WARNING: failed to print log on gui: '+message+', because gui seems not to load.')
            }
        }
    }

}

export const log: LogService = new LogService()