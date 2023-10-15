import { util } from './util'

export class Subscribers<T> {
	private subscribers: ((data: T) => Promise<void>)[] = []

	public subscribe(subscriber: (data: T) => Promise<void>): void {
		this.subscribers.push(subscriber)
	}

	// TODO: hand in {object, function: (data: T) => Promise<void>, arguments} for comparison?
	public unsubscribe(subscriber: (data: T) => Promise<void>): void {
		const index: number = this.subscribers.indexOf(subscriber)
		if (index < 0) {
			util.logWarning(`Subscribers::unsubscribe subscriber '${subscriber}' not found. Maybe you handed in an anonym subscriber as arrow function.`) // TODO: simply use 'console.warn(..)' as it is forwarded?
			return
		}
		this.subscribers.splice(index, 1)
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