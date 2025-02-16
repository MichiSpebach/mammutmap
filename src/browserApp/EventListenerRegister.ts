import { EventListenerCallback, EventType } from '../core/renderEngine/domAdapter'

export type EventListenerHandle = {
    type: EventType,
    capture?: boolean,
    listener: EventListenerCallback,
    nativeListener: (event: any) => void // TODO: fix any? use something like '(event: ? extends Event) => void'
}

export class EventListenerRegister {
    private eventListeners: Map<string, EventListenerHandle[]> = new Map()

    public add(elementId: string, listenerHandle: EventListenerHandle): void {
        const listenersForElement: EventListenerHandle[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            this.eventListeners.set(elementId, [listenerHandle])
        } else {
            if (this.exists(elementId, listenerHandle)) {
                // TODO: log warning
            }
            listenersForElement.push(listenerHandle)
        }
    }

    public pop(elementId: string, type: EventType, listener?: EventListenerCallback): EventListenerHandle {
        const handle: EventListenerHandle = this.find(elementId, type, listener)
        this.remove(elementId, handle.listener)
        return handle
    }

    public find(elementId: string, type: EventType, listener?: EventListenerCallback): EventListenerHandle {
        const listenersForElement: EventListenerHandle[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            console.warn(`EventListenerRegister::find(..) no listeners are registered for elementId '${elementId}', defaulting to '() => {}'.`)
            return {type, capture: false, listener: () => {}, nativeListener: () => {}}
        }
        const matchingListeners: EventListenerHandle[] = listenersForElement.filter(value => {
            if (listener && listener !== value.listener) {
                return false
            }
            return value.type === type
        })
        if (matchingListeners.length === 0) {
            let message: string = `EventListenerRegister::find(..) no listeners are registered`
            message += ` for elementId '${elementId}', type '${type}' and if set listener '${listener}', defaulting to '() => {}'.`
            message += ` By the way there are ${listenersForElement.length} listeners registered for this element.`
            console.warn(message)
            return {type, capture: false, listener: () => {}, nativeListener: () => {}}
        }
        if (matchingListeners.length > 1) {
            console.warn(`EventListenerRegister::find(..) multiple listeners are registered for elementId '${elementId}', type '${type}' and if set listener '${listener}', defaulting to first.`)
        }
        return matchingListeners[0]
    }

    public exists(elementId: string, handle: EventListenerHandle): boolean {
        return false
        // TODO: implement
    }

    public remove(elementId: string, listener: EventListenerCallback): void {
        const listenersForElement: EventListenerHandle[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            console.warn(`EventListenerRegister::remove(..) no listeners are registered for elementId '${elementId}'.`)
            return
        }
        const index: number = listenersForElement.findIndex(value => value.listener === listener)
        if (index < 0) {
            console.warn(`EventListenerRegister::remove(..) listener for elementId '${elementId}' not found.`)
            return
        }
        listenersForElement.splice(index, 1)
    }
}