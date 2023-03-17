import { util } from '../core/util/util'
import { EventType } from '../core/domAdapter'

export type EventListenerHandle = {
    type: EventType, 
    capture?: boolean, 
    nativeListener: (event: any) => void // TODO: fix any? use something like '(event: ? extends Event) => void'
}

export class EventListenerRegister {
    private eventListeners: Map<string, EventListenerHandle[]> = new Map()

    public add<T extends Event>(elementId: string, type: EventType, capture: boolean, nativeListener: (event: T) => void): EventListenerHandle {
        const handle: EventListenerHandle = {type, capture, nativeListener}
        const listenersForElement: EventListenerHandle[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            this.eventListeners.set(elementId, [handle])
        } else {
            if (this.exists(elementId, handle)) {
                // TODO: log warning
            }
            listenersForElement.push(handle)
        }
        return handle
    }

    public pop(elementId: string, type: EventType, nativeListener?: (event: any) => void): EventListenerHandle {
        const handle: EventListenerHandle = this.find(elementId, type, nativeListener)
        this.remove(elementId, handle.nativeListener)
        return handle
    }

    public find(elementId: string, type: EventType, nativeListener?: (event: any) => void): EventListenerHandle {
        const listenersForElement: EventListenerHandle[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            util.logWarning(`EventListenerRegister::find(..) no listeners are registered for elementId '${elementId}', defaulting to '() => {}'.`)
            return {type, capture: false, nativeListener: () => {}}
        }
        const matchingListeners: EventListenerHandle[] = listenersForElement.filter(value => {
            if (nativeListener && nativeListener !== value.nativeListener) {
                return false
            }
            return value.type === type
        })
        if (matchingListeners.length === 0) {
            util.logWarning(`EventListenerRegister::find(..) no listeners are registered for elementId '${elementId}', type '${type}' and if set nativeListener '${nativeListener}', defaulting to '() => {}'.`)
            return {type, capture: false, nativeListener: () => {}}
        }
        if (matchingListeners.length > 1) {
            util.logWarning(`EventListenerRegister::find(..) multiple listeners are registered for elementId '${elementId}', type '${type}' and if set nativeListener '${nativeListener}', defaulting to first.`)
        }
        return matchingListeners[0]
    }

    public exists<T extends Event>(elementId: string, handle: EventListenerHandle): boolean {
        return false
        // TODO: implement
    }

    public remove(elementId: string, nativeListener: (event: any) => void): void {
        const listenersForElement: EventListenerHandle[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            util.logWarning(`EventListenerRegister::remove(..) no listeners are registered for elementId '${elementId}'.`)
            return
        }
        const index: number = listenersForElement.findIndex(value => value.nativeListener === nativeListener)
        if (index < 0) {
            util.logWarning(`EventListenerRegister::remove(..) listener for elementId '${elementId}' not found.`)
            return
        }
        listenersForElement.splice(index, 1)
    }
}