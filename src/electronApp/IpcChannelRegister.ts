import { IpcMainEvent, ipcMain } from 'electron'
import { EventListenerCallback, EventType } from '../core/domAdapter'
import { util } from '../core/util/util'

export class IpcEventListenerChannel {
    public constructor(
        public readonly listener: EventListenerCallback,
        public readonly ipcListener: (event: IpcMainEvent, ...args: any[]) => void,
        private readonly channelSuffix: string,
        public readonly capture: boolean|undefined
    ) {}

    public getChannelName(id: string, eventType: EventType) {
        return `${id}_${eventType}_${this.channelSuffix}`
    }
}

export class IpcChannelRegister {
    private ipcChannelDictionary: Map<string, { eventType: EventType, listeners: IpcEventListenerChannel[] }[]> = new Map() // TODO: refactor, move into object oriented classes with methods

    public getIpcChannelsCount(): number {
        let count = 0
        this.ipcChannelDictionary.forEach(channelsForElement => channelsForElement.forEach(channelsForEventType => count += channelsForEventType.listeners.length))
        return count
    }

    public addIpcChannelListener(
        id: string, 
        eventType: EventType, 
        listener: EventListenerCallback, 
        ipcListener: (event: IpcMainEvent, ...args: any[]) => void, 
        capture?: boolean
    ): string {
        const channelSuffix: string = util.generateId() // important when channels are not removed directly, otherwise old ipcListeners would be recalled
        const channelName = `${id}_${eventType}_`

        let channelsForId: { eventType: EventType, listeners: IpcEventListenerChannel[] }[] | undefined = this.ipcChannelDictionary.get(id)
        if (!channelsForId) {
            channelsForId = []
            this.ipcChannelDictionary.set(id, channelsForId)
        }

        let channel: { eventType: EventType, listeners: IpcEventListenerChannel[] } | undefined = channelsForId.find(channel => channel.eventType === eventType)
        if (!channel) {
            channelsForId.push({ eventType, listeners: [new IpcEventListenerChannel(listener, ipcListener, channelSuffix, capture)] })
        } else {
            channel.listeners.push(new IpcEventListenerChannel(listener, ipcListener, channelSuffix, capture))
        }
        ipcMain.on(channelName + channelSuffix, ipcListener)

        return channelName + channelSuffix
    }

    public removeIpcChannelListener(id: string, eventType: EventType, listener: EventListenerCallback|'all'): IpcEventListenerChannel[] {
        let channelsForId: { eventType: EventType, listeners: IpcEventListenerChannel[] }[] | undefined = this.ipcChannelDictionary.get(id)
        if (!channelsForId) {
            util.logWarning(`ElectronIpcDomAdapter::removeIpcChannelListener(..) no listeners are registered for element with id '${id}' at all.`)
            return []
        }

        let channel: { eventType: EventType, listeners: IpcEventListenerChannel[] } | undefined = channelsForId.find(channel => channel.eventType === eventType)
        if (!channel) {
            util.logWarning(`ElectronIpcDomAdapter::removeIpcChannelListener(..) no '${eventType}' listeners are registered for element with id '${id}'.`)
            return []
        }

        if (listener === 'all') {
            for (const listener of channel.listeners) {
                ipcMain.removeAllListeners(listener.getChannelName(id, eventType))
            }
            this.removeChannelFromChannels(id, channel, channelsForId)
            return channel.listeners
        }

        /*if (channel.listeners.length > 1) {
          // TODO: remove warning as soon as 'only remove specified listener' in removeEventListenerFrom(..) is implemented
          let message = `ElectronIpcDomAdapter::removeIpcChannelListener(..) element with id '${id}' has ${channel.listeners.length} listeners for eventType '${eventType}'`
          message += `, be aware that removing specific listener is not implemented correctly yet and simply all nativeListeners are removed.`
          util.logWarning(message)
        }*/

        const listenerAndIpcListener: IpcEventListenerChannel | undefined = channel.listeners.find(listenerAndIpcListener => listenerAndIpcListener.listener === listener)
        if (!listenerAndIpcListener) {
            util.logWarning(`ElectronIpcDomAdapter::removeIpcChannelListener(..) specific listener for element with id '${id}' and eventType '${eventType}' not registered.`)
            return []
        }
        ipcMain.removeListener(listenerAndIpcListener.getChannelName(id, eventType), listenerAndIpcListener.ipcListener)
        if (channel.listeners.length === 1) {
            this.removeChannelFromChannels(id, channel, channelsForId)
        } else {
            channel.listeners.splice(channel.listeners.indexOf(listenerAndIpcListener), 1)
        }
        return [listenerAndIpcListener]
    }

    private removeChannelFromChannels(
        id: string,
        channel: { eventType: EventType, listeners: IpcEventListenerChannel[] },
        channels: { eventType: EventType, listeners: IpcEventListenerChannel[] }[]
    ): void {
        if (channels.length === 1) {
            this.ipcChannelDictionary.delete(id)
        } else {
            channels.splice(channels.indexOf(channel), 1)
        }
    }
}