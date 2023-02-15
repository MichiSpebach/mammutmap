import { util } from './util'

export class Subscribers<T> {
    private subscribers: ((data: T) => Promise<void>)[] = []

    public subscribe(subscriber: (data: T) => Promise<void>): void {
        this.subscribers.push(subscriber)
    }

    public async callSubscribers(data: T): Promise<void> {
        await Promise.all(this.subscribers.map(subscriber => 
            this.callSubscriber(subscriber, data)
        ))
    }

    private async callSubscriber(subscriber: (data: T) => Promise<void>, data: T): Promise<void> {
        try {
            await subscriber(data)
        } catch (error) {
            util.logWarning('Error happened while calling subscribers: '+error)
        }
    }
}