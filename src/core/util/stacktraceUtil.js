"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCallStackPaths = exports.getCallerFilePath = exports.getCallerDirPath = void 0;
const util_1 = require("./util");
function getCallerDirPath(skipThroughFilePath) {
    return util_1.util.removeLastElementFromPath(getCallerFilePath(skipThroughFilePath));
}
exports.getCallerDirPath = getCallerDirPath;
function getCallerFilePath(skipThroughFilePath) {
    if (!skipThroughFilePath) {
        skipThroughFilePath = getCallerFilePath(__filename);
    }
    const callStack = getCallStackPaths();
    let skippedThrough = false;
    for (let i = 0; i < callStack.length; i++) {
        if (callStack[i] === skipThroughFilePath) {
            skippedThrough = true;
        }
        else if (skippedThrough) {
            return callStack[i];
        }
    }
    throw new Error(`Failed to get getCallerFilePath with skipping through "${skipThroughFilePath}". CallStack paths are ${callStack}`);
}
exports.getCallerFilePath = getCallerFilePath;
function getCallStackPaths() {
    const stacktrace = new Error().stack;
    if (!stacktrace) {
        throw new Error('Failed to getCallerFilesDirname because failed to get stacktrace.');
    }
    return extractPathsFromStacktrace(stacktrace);
}
exports.getCallStackPaths = getCallStackPaths;
function extractPathsFromStacktrace(stacktrace) {
    const lines = stacktrace.split('\n');
    if (lines[0].trim() !== 'Error:') {
        util_1.util.logWarning(`Expected line with index 0 of stacktrace to match "Error:" but was "${lines[0]}".`);
    }
    else {
        lines.shift();
    }
    return lines.map((value, index) => extractPathFromStacktraceLine(value, index + 1));
}
function extractPathFromStacktraceLine(stacktraceLine, stacktraceLineIndex) {
    if (!stacktraceLine.trim().startsWith('at ')) {
        util_1.util.logWarning(`Expected line with index ${stacktraceLineIndex} of stacktrace to start with "at " but was "${stacktraceLine}".`);
    }
    const pathStartIndex = stacktraceLine.indexOf('(') + 1;
    if (pathStartIndex < 0) {
        util_1.util.logWarning(`Did not find start of path in line with index ${stacktraceLineIndex} of stacktrace. Line is "${stacktraceLine}".`);
    }
    const pathEndIndex = stacktraceLine.lastIndexOf(')');
    if (pathEndIndex < 0) {
        util_1.util.logWarning(`Did not find end of path in line with index ${stacktraceLineIndex} of stacktrace. Line is "${stacktraceLine}".`);
    }
    let path = stacktraceLine.substring(pathStartIndex, pathEndIndex);
    path = removePositionInfoFromStacktraceLine(path, 'column', stacktraceLineIndex);
    path = removePositionInfoFromStacktraceLine(path, 'row', stacktraceLineIndex);
    return path;
}
function removePositionInfoFromStacktraceLine(stacktraceLine, positionType, stacktraceLineIndex) {
    const positionInfoStartIndex = stacktraceLine.lastIndexOf((':'));
    if (positionInfoStartIndex < 0) {
        if (stacktraceLine !== '<anonymous>') {
            util_1.util.logWarning(`Did not find ${positionType} information in line with index ${stacktraceLineIndex} of stacktrace. Line is "${stacktraceLine}".`);
        }
        return stacktraceLine;
    }
    return stacktraceLine.substring(0, positionInfoStartIndex);
}
