"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkipToNewestScheduler = void 0;
class SkipToNewestScheduler {
    constructor() {
        this.ongoingProcess = null;
        this.scheduledProcess = null;
    }
    async schedule(process) {
        if (!this.ongoingProcess) {
            this.ongoingProcess = process();
            await this.ongoingProcess;
            this.ongoingProcess = null;
        }
        else {
            this.scheduledProcess = process;
            await this.ongoingProcess;
            if (!this.ongoingProcess) {
                this.ongoingProcess = this.scheduledProcess();
                this.scheduledProcess = null;
                await this.ongoingProcess;
                this.ongoingProcess = null;
            }
            else {
                await this.ongoingProcess;
            }
        }
    }
}
exports.SkipToNewestScheduler = SkipToNewestScheduler;
