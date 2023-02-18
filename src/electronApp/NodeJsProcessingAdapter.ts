import { exec, ChildProcess } from 'child_process'
import { ProcessingAdapter } from '../core/processingAdapter'

export class NodeJsProcessingAdapter implements ProcessingAdapter {

    public runShellCommand(command: string): ChildProcess {
        return exec(command)
    }
    
}