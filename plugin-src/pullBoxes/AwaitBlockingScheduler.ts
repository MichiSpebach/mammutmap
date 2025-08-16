
export class AwaitBlockingScheduler {
	private ongoingProcesses: {mode: 'concurrent'|'runAlone', process: Promise<void>}[] = []

	public async schedule(mode: 'concurrent'|'runAlone', process: () => Promise<void>): Promise<void> {
		if (mode === 'runAlone') {
			if (this.ongoingProcesses.length > 0) {
				await Promise.all(this.ongoingProcesses.map(process => process.process))
				return this.schedule(mode, process)
			}
		} else {
			if (this.ongoingProcesses.some(process => process.mode === 'runAlone')) {
				await Promise.all(this.ongoingProcesses.map(process => process.process))
				return this.schedule(mode, process)
			}
		}
		const ongoingProcess = {mode, process: process()}
		this.ongoingProcesses.push(ongoingProcess)
		await ongoingProcess.process
		this.ongoingProcesses.splice(this.ongoingProcesses.indexOf(ongoingProcess), 1)
	}
}