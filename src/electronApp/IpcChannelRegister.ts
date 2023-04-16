import { IpcMainEvent, ipcMain } from 'electron'
import { EventListenerCallback, EventType } from '../core/domAdapter'
import { util } from '../core/util/util'

export class IpcEventListenerHandle {
    private readonly ipcChannelSuffix: string = util.generateId() // important when channels are not removed directly, otherwise old ipcListeners would be recalled
    
    public constructor(
        public readonly listener: EventListenerCallback,
        public readonly ipcListener: (event: IpcMainEvent, ...args: any[]) => void,
        public readonly capture: boolean|undefined
    ) {}

    public getIpcChannelName(id: string, eventType: EventType) {
        return `${id}_${eventType}_${this.ipcChannelSuffix}`
    }
}

export class IpcChannelRegister {
    private ipcChannelDictionary: Map<string, { eventType: EventType, listeners: IpcEventListenerHandle[] }[]> = new Map() // TODO: refactor, move into object oriented classes with methods

    public getIpcChannelsCount(): number {
        let count = 0
        this.ipcChannelDictionary.forEach(channelsForElement => channelsForElement.forEach(channelsForEventType => count += channelsForEventType.listeners.length))
        return count
    }

    public addEventListener(
        id: string, 
        eventType: EventType, 
        listener: EventListenerCallback, 
        ipcListener: (event: IpcMainEvent, ...args: any[]) => void, 
        capture?: boolean
    ): string {
        const eventListenerHandle = new IpcEventListenerHandle(listener, ipcListener, capture)

        let channelsForId: { eventType: EventType, listeners: IpcEventListenerHandle[] }[] | undefined = this.ipcChannelDictionary.get(id)
        if (!channelsForId) {
            channelsForId = []
            this.ipcChannelDictionary.set(id, channelsForId)
        }

        let channelsForEventType: { eventType: EventType, listeners: IpcEventListenerHandle[] } | undefined = channelsForId.find(channel => channel.eventType === eventType)
        if (!channelsForEventType) {
            channelsForId.push({ eventType, listeners: [eventListenerHandle] })
        } else {
            channelsForEventType.listeners.push(eventListenerHandle)
        }
        ipcMain.on(eventListenerHandle.getIpcChannelName(id, eventType), ipcListener)

        return eventListenerHandle.getIpcChannelName(id, eventType)
    }

    public removeEventListener(id: string, eventType: EventType, listener: EventListenerCallback|'all'): IpcEventListenerHandle[] {
        let channelsForId: { eventType: EventType, listeners: IpcEventListenerHandle[] }[] | undefined = this.ipcChannelDictionary.get(id)
        if (!channelsForId) {
            util.logWarning(`ElectronIpcDomAdapter::removeIpcChannelListener(..) no listeners are registered for element with id '${id}' at all.`)
            return []
        }

        let channel: { eventType: EventType, listeners: IpcEventListenerHandle[] } | undefined = channelsForId.find(channel => channel.eventType === eventType)
        if (!channel) {
            util.logWarning(`ElectronIpcDomAdapter::removeIpcChannelListener(..) no '${eventType}' listeners are registered for element with id '${id}'.`)
            return []
        }

        if (listener === 'all') {
            for (const listener of channel.listeners) {
                ipcMain.removeAllListeners(listener.getIpcChannelName(id, eventType))
            }
            this.removeChannelFromChannels(id, channel, channelsForId)
            return channel.listeners
        }

        const eventListenerHandle: IpcEventListenerHandle | undefined = channel.listeners.find(eventListenerChannel => eventListenerChannel.listener === listener)
        if (!eventListenerHandle) {
            util.logWarning(`ElectronIpcDomAdapter::removeIpcChannelListener(..) specific listener for element with id '${id}' and eventType '${eventType}' not registered.`)
            return []
        }
        ipcMain.removeListener(eventListenerHandle.getIpcChannelName(id, eventType), eventListenerHandle.ipcListener)
        if (channel.listeners.length === 1) {
            this.removeChannelFromChannels(id, channel, channelsForId)
        } else {
            channel.listeners.splice(channel.listeners.indexOf(eventListenerHandle), 1)
        }
        return [eventListenerHandle]
    }

    private removeChannelFromChannels(
        id: string,
        channel: { eventType: EventType, listeners: IpcEventListenerHandle[] },
        channels: { eventType: EventType, listeners: IpcEventListenerHandle[] }[]
    ): void {
        if (channels.length === 1) {
            this.ipcChannelDictionary.delete(id)
        } else {
            channels.splice(channels.indexOf(channel), 1)
        }
    }
}