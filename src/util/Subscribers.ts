
export class Subscribers<T> {
    private subscribers: ((data: T) => void)[] = []

    public subscribe(subscriber: (data: T) => void): void {
        this.subscribers.push(subscriber)
    }

    public callSubscribers(data: T) {
        for (const subscriber of this.subscribers) {
            subscriber(data)
        }
    }
}