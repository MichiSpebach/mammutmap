
export class Subscribers<T> {
    private subscribers: ((data: T) => void)[] = []

    public subscribe(subscriber: (data: T) => void): void {
        this.subscribers.push(subscriber)
    }

    public call(data: T) {
        for (const subscriber of this.subscribers) {
            subscriber(data)
        }
    }
}