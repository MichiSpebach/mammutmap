import { util } from '../core/util/util'
import { EventType } from '../core/domAdapter'

type MapEntryValue = {type: EventType, listener: (event: any) => void} // TODO: fix any, use something like '(event: ? extends Event) => void'

export class EventListenerRegister {
    private eventListeners: Map<string, MapEntryValue[]> = new Map()

    public add<T extends Event>(elementId: string, type: EventType, listener: (event: T) => void): void {
        const listenersForElement: MapEntryValue[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            this.eventListeners.set(elementId, [{type, listener}])
        } else {
            listenersForElement.push({type, listener})
        }
    }

    public pop(elementId: string, type: EventType): ((event: Event) => void) {
        const listener = this.find(elementId, type)
        this.remove(elementId, listener)
        return listener
    }

    public find(elementId: string, type: EventType): ((event: Event) => void) {
        const listenersForElement: MapEntryValue[] | undefined = this.eventListeners.get(elementId)
        if (!listenersForElement) {
            util.logWarning(`EventListenerRegister::find(..) no listeners are registered for elementId '${elementId}', defaulting to '() => {}'.`)
            return () => {}
        }
        const values: MapEntryValue[] = listenersForElement.filter(value => value.type === type)
        if (values.length === 0) {
            util.logWarning(`EventListenerRegister::find(..) no listeners are registered for elementId '${elementId}' and type '${type}', defaulting to '() => {}'.`)
            return () => {}
        }
        if (values.length > 1) {
            util.logWarning(`EventListenerRegister::find(..) multiple listeners are registered for elementId '${elementId}' and type '${type}', defaulting to first.`)
        }
        return values[0].listener
    }

    public remove(elementId: string, listener: (event: Event) => void): void {
        const listenersForElement: MapEntryValue[] | undefined = this.eventListeners.get(elementId)
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