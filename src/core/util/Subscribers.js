"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscribers = void 0;
const util_1 = require("./util");
class Subscribers {
    constructor() {
        this.subscribers = [];
    }
    subscribe(subscriber) {
        this.subscribers.push(subscriber);
    }
    async callSubscribers(data) {
        await Promise.all(this.subscribers.map(subscriber => this.callSubscriber(subscriber, data)));
    }
    async callSubscriber(subscriber, data) {
        try {
            await subscriber(data);
        }
        catch (error) {
            util_1.util.logWarning('Error happened while calling subscribers: ' + error);
        }
    }
}
exports.Subscribers = Subscribers;
