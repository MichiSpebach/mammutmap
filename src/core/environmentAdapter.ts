
export let environment: EnvironmentAdapter

export function init(implementation: EnvironmentAdapter): void {
    environment = implementation
}

export interface ChildProcess { // subset of child_process.ChildProcess
    on(event: 'exit', listener: (code: number) => void): this;
    // TODO: add more stuff like in child_process.ChildProcess
}

export interface EnvironmentAdapter {
    getEnvironmentName(): 'electron'|'browser'|'vscode'
    runShellCommand(command: string, options?: { currentWorkingDirectory?: string }): ChildProcess
    openFile(path: string): void
}