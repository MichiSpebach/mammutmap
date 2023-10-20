import { ChildProcess, EnvironmentAdapter } from '../core/environmentAdapter'

export class BrowserEnvironmentAdapter implements EnvironmentAdapter {

	public runShellCommand(command: string): ChildProcess {
		throw new Error('Method not implemented.');
	}

	public openFile(path: string): void {
		window.open(path)
	}

}