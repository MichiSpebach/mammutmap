import {exec, ChildProcess} from 'child_process'
import {EnvironmentAdapter} from '../core/environmentAdapter'
import {log} from '../core/logService'
import {shell} from 'electron'

export class ElectronEnvironmentAdapter implements EnvironmentAdapter {

    public getEnvironmentName(): 'electron' {
        return 'electron'
    }

    public runShellCommand(command: string, options: { cwd: string }): ChildProcess {
        log.info(`executing '${command}'`)
        return exec(command, options,
            (error: unknown | null, stdout: string, stderr: string) => {
                if (error) {
                    log.warning(error.toString())
                }
            })
    }

    public openFile(path: string): void {
        shell.openPath(path) // works only for files
        //this.runShellCommand('code '+path)
    }

    public openPath(path: string): void {
        shell.openExternal(path) // works for files and folders
    }

}