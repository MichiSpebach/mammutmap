import { exec, ChildProcess } from 'child_process'
import { EnvironmentAdapter } from '../core/environmentAdapter'
import { log } from '../core/logService'
import { shell } from 'electron'

export class ElectronEnvironmentAdapter implements EnvironmentAdapter {

	public runShellCommand(command: string): ChildProcess {
		log.info(`executing '${command}'`)
		return exec(command, (error: unknown|null, stdout: string, stderr: string) => {
			if (error) {
				log.warning(error.toString())
			}
		})
	}

	public openFile(path: string): void {
		shell.openPath(path)
		//this.runShellCommand('code '+path)
	}

}