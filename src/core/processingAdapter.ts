
export let processing: ProcessingAdapter

export function init(implementation: ProcessingAdapter): void {
    processing = implementation
}

export interface ChildProcess { // subset of child_process.ChildProcess
    // TODO: add some stuff like in child_process.ChildProcess
}

export interface ProcessingAdapter {
    runShellCommand(command: string): ChildProcess
}