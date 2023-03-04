import { util } from '../core/util/util'
import { EventType } from '../core/domAdapter'

export type EventListenerHandle = {type: EventType, capture: boolean, listener: (event: any) => void} // TODO: fix any, use something like '(event: ? extends Event) => void'

export class EventListenerRegister {
    private eventListeners: Map<string, EventListenerHandle[]> = new Map()

    public add<T extends Event>(elementId: string, type: EventType, capture: boolean, listener: (event: T) => void): EventListenerHandle {
        const handle: EventListenerHandle = {type, capture, listener}
        const listenersForElement: EventListenerHandle[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            this.eventListeners.set(elementId, [handle])
        } else {
            listenersForElement.push(handle)
        }
        return handle
    }

    public pop(elementId: string, type: EventType): EventListenerHandle {
        const handle: EventListenerHandle = this.find(elementId, type)
        this.remove(elementId, handle.listener)
        return handle
    }

    public find(elementId: string, type: EventType): EventListenerHandle {
        const listenersForElement: EventListenerHandle[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            util.logWarning(`EventListenerRegister::find(..) no listeners are registered for elementId '${elementId}', defaulting to '() => {}'.`)
            return {type, capture: false, listener: () => {}}
        }
        const values: EventListenerHandle[] = listenersForElement.filter(value => value.type === type)
        if (values.length === 0) {
            util.logWarning(`EventListenerRegister::find(..) no listeners are registered for elementId '${elementId}' and type '${type}', defaulting to '() => {}'.`)
            return {type, capture: false, listener: () => {}}
        }
        if (values.length > 1) {
            util.logWarning(`EventListenerRegister::find(..) multiple listeners are registered for elementId '${elementId}' and type '${type}', defaulting to first.`)
        }
        return values[0]
    }

    public remove(elementId: string, listener: (event: Event) => void): void {
        const listenersForElement: EventListenerHandle[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            util.logWarning(`EventListenerRegister::remove(..) no listeners are registered for elementId '${elementId}'.`)
            return
        }
        const index: number = listenersForElement.findIndex(value => value.listener === listener)
        if (index < 0) {
            util.logWarning(`EventListenerRegister::remove(..) listener for elementId '${elementId}' not found.`)
            return
        }
        listenersForElement.splice(index, 1)
    }
}