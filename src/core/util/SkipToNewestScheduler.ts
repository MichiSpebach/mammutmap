
export class SkipToNewestScheduler {
    private ongoingProcess: Promise<void>|null = null
    private scheduledProcess: (() => Promise<void>)|null = null

    public async schedule(process: () => Promise<void>): Promise<void> {
        if (!this.ongoingProcess) {
            this.ongoingProcess = process()
            await this.ongoingProcess
            this.ongoingProcess = null
        } else {
            this.scheduledProcess = process
            await this.ongoingProcess
            if (!this.ongoingProcess) {
                this.ongoingProcess = this.scheduledProcess()
                this.scheduledProcess = null
                await this.ongoingProcess
                this.ongoingProcess = null
            } else {
                await this.ongoingProcess
            }
        }
    }

}