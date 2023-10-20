
export let environment: EnvironmentAdapter

export function init(implementation: EnvironmentAdapter): void {
    environment = implementation
}

export interface ChildProcess { // subset of child_process.ChildProcess
    // TODO: add some stuff like in child_process.ChildProcess
}

export interface EnvironmentAdapter {
    runShellCommand(command: string): ChildProcess
    openFile(path: string): void
}