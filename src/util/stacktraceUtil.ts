import { util } from '../util'

export function getCallerDirPath(skipThroughFilePath?: string): string {
    return util.removeLastElementFromPath(getCallerFilePath(skipThroughFilePath))
}

export function getCallerFilePath(skipThroughFilePath?: string): string {
    if (!skipThroughFilePath) {
        skipThroughFilePath = getCallerFilePath(__filename)
    }

    const callStack: string[] = getCallStackPaths()

    let skippedThrough: boolean = false
    for (let i = 0; i < callStack.length; i++) {
        if (callStack[i] === skipThroughFilePath) {
            skippedThrough = true
        } else if (skippedThrough) {
            return callStack[i]
        }
    }

    throw new Error(`Failed to get getCallerFilePath with skipping through "${skipThroughFilePath}". CallStack paths are ${callStack}`)
}

export function getCallStackPaths(): string[] {
    const stacktrace: string | undefined = new Error().stack
    if (!stacktrace) {
        throw new Error('Failed to getCallerFilesDirname because failed to get stacktrace.')
    }
    return extractPathsFromStacktrace(stacktrace)
}

function extractPathsFromStacktrace(stacktrace: string): string[] {
    const lines: string[] = stacktrace.split('\n')

    if (lines[0].trim() !== 'Error:') {
        util.logWarning(`Expected line with index 0 of stacktrace to match "Error:" but was "${lines[0]}".`)
    } else {
        lines.shift()
    }

    return lines.map((value: string, index: number) => extractPathFromStacktraceLine(value, index + 1))
}

function extractPathFromStacktraceLine(stacktraceLine: string, stacktraceLineIndex: number): string {
    if (!stacktraceLine.trim().startsWith('at ')) {
        util.logWarning(`Expected line with index ${stacktraceLineIndex} of stacktrace to start with "at " but was "${stacktraceLine}".`)
    }

    const pathStartIndex: number = stacktraceLine.indexOf('(') + 1
    if (pathStartIndex < 0) {
        util.logWarning(`Did not find start of path in line with index ${stacktraceLineIndex} of stacktrace. Line is "${stacktraceLine}".`)
    }

    const pathEndIndex: number = stacktraceLine.lastIndexOf(')')
    if (pathEndIndex < 0) {
        util.logWarning(`Did not find end of path in line with index ${stacktraceLineIndex} of stacktrace. Line is "${stacktraceLine}".`)
    }

    let path: string = stacktraceLine.substring(pathStartIndex, pathEndIndex)

    const columnInfoStartIndex: number = path.lastIndexOf((':'))
    if (columnInfoStartIndex < 0) {
        util.logWarning(`Did not find column information in line with index ${stacktraceLineIndex} of stacktrace. Line is "${stacktraceLine}".`)
    }

    path = path.substring(0, columnInfoStartIndex)

    const rowInfoStartIndex: number = path.lastIndexOf((':'))
    if (rowInfoStartIndex < 0) {
        util.logWarning(`Did not find row information in line with index ${stacktraceLineIndex} of stacktrace. Line is "${stacktraceLine}".`)
    }

    return path.substring(0, rowInfoStartIndex)
}