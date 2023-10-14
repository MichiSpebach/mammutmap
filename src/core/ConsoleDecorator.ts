import { InspectOptions } from 'util'
import { log } from './logService'

export class ConsoleDecorator implements Console {

    public constructor(
        private readonly originalConsole: Console
    ) {}

    Console: console.ConsoleConstructor = this.originalConsole.Console

    assert(value?: any, message?: string, ...optionalParams: any[]): void {
        this.originalConsole.assert(value, message, ...optionalParams)
        if (!value) {
            log.storeLogAndCallSubscribers(`Assertion failed: ${message}`, 'orange')
        }
    }

    clear(): void {
        this.originalConsole.clear()
        log.clear()
    }

    count(label?: string): void {
        this.originalConsole.count(label)
    }

    countReset(label?: string): void {
        this.originalConsole.countReset(label)
    }

    debug(message?: string, ...optionalParams: any[]): void {
        this.originalConsole.debug(message, ...optionalParams)
        log.storeLogAndCallSubscribers(`debug: ${message}`, 'grey')
    }

    dir(obj?: any, options?: InspectOptions): void {
        this.originalConsole.dir(obj, options)
    }

    dirxml(...data: any[]): void {
        this.originalConsole.dirxml(...data)
    }

    error(message?: any, ...optionalParams: any[]): void {
        this.originalConsole.error(message, ...optionalParams)
        log.storeLogAndCallSubscribers(`error: ${message}`, 'red')
    }

    group(...label: any[]): void {
        this.originalConsole.group(...label)
    }

    groupCollapsed(...label: any[]): void {
        this.originalConsole.groupCollapsed(...label)
    }

    groupEnd(): void {
        this.originalConsole.groupEnd()
    }

    info(message?: any, ...optionalParams: any[]): void {
        this.originalConsole.info(message, ...optionalParams)
        log.storeLogAndCallSubscribers(`info: ${message}`, 'grey')
    }

    log(message?: any, ...optionalParams: any[]): void {
        this.originalConsole.log(message, ...optionalParams)
        log.storeLogAndCallSubscribers(`log: ${message}`, 'grey')
    }

    table(tabularData: any, properties?: ReadonlyArray<string>): void {
        this.originalConsole.table(tabularData, properties)
    }

    time(label?: string): void {
        this.originalConsole.time(label)
    }

    timeEnd(label?: string): void {
        this.originalConsole.timeEnd(label)
    }

    timeLog(label?: string, ...data: any[]): void {
        this.originalConsole.timeLog(label, ...data)
    }

    timeStamp(label?: string): void {
        this.originalConsole.timeStamp(label)
    }

    trace(message?: any, ...optionalParams: any[]): void {
        this.originalConsole.trace(message, ...optionalParams)
        log.storeLogAndCallSubscribers(`trace: ${message}`, 'orange')
    }

    warn(message?: any, ...optionalParams: any[]): void {
        this.originalConsole.warn(message, ...optionalParams)
        log.storeLogAndCallSubscribers(`warning: ${message}`, 'orange')
    }

    profile(label?: string): void {
        this.originalConsole.profile(label)
    }

    profileEnd(label?: string): void {
        this.originalConsole.profileEnd(label)
    }
}
