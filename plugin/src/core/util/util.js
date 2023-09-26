"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.util = void 0;
const processingAdapter_1 = require("../processingAdapter");
const RenderManager_1 = require("../RenderManager");
const styleAdapter_1 = require("../styleAdapter");
const indexHtmlIds = require("../indexHtmlIds");
const stacktraceUtil = require("./stacktraceUtil");
const logService_1 = require("../logService");
class Util {
    constructor() {
        this.githubProjectAddress = 'https://github.com/MichiSpebach/mammutmap';
        this.pluginTutorialAddress = this.githubProjectAddress + '/blob/main/pluginTutorial.md';
        // TODO: move to HintManager/HintComponent
        this.hintToDeactivateSnapToGrid = 'Press CTRL to deactivate snapToGrid';
        this.hintId = 'hint';
        this.hint = null;
        // TODO: move to mouseEventBlockerScreenOverlay.ts file
        this.mouseEventBlockerScreenOverlayState = 'notInitialized';
    }
    runShellCommand(command) {
        return processingAdapter_1.processing.runShellCommand(command);
    }
    /** @deprecated use log.debug(..) instead */
    logDebug(message, options) {
        logService_1.log.debug(message, options);
    }
    /** @deprecated use log.info(..) instead */
    logInfo(message, options) {
        logService_1.log.info(message, options);
    }
    /** @deprecated use log.warning(..) instead */
    logWarning(message, options) {
        logService_1.log.warning(message, options);
    }
    /** @deprecated use log.errorAndThrow(..) instead */
    logError(message, options) {
        logService_1.log.errorAndThrow(message, options);
    }
    /** @deprecated use log.errorWithoutThrow(..) instead */
    logErrorWithoutThrow(message, options) {
        logService_1.log.errorWithoutThrow(message, options);
    }
    createWebLinkHtml(address, label) {
        return `<a style="color:skyblue;" target="_blank" href="${address}">${label ?? address}</a>`;
    }
    async setHint(hint, active) {
        if (active) {
            if (!this.hint) {
                this.hint = hint;
                await RenderManager_1.renderManager.addContentTo(indexHtmlIds.bodyId, `<div id="${this.hintId}" class="${styleAdapter_1.style.getHintClass()}">${hint}</div>`);
            }
            else if (this.hint !== hint) {
                this.hint = hint;
                await RenderManager_1.renderManager.setContentTo(this.hintId, hint);
            }
        }
        else {
            if (this.hint === hint) {
                this.hint = null;
                await RenderManager_1.renderManager.remove(this.hintId);
            }
        }
    }
    async setMouseEventBlockerScreenOverlay(active, priority = RenderManager_1.RenderPriority.NORMAL) {
        const mouseEventBlockerScreenOverlayId = 'mouseEventBlockerScreenOverlay';
        const pros = [];
        if (active) {
            if (this.mouseEventBlockerScreenOverlayState === 'notInitialized') {
                const mapOverlayMoveLock = {
                    type: 'div',
                    id: mouseEventBlockerScreenOverlayId,
                    style: { position: "fixed", top: "0px", width: "100%", height: "100%" }
                };
                pros.push(RenderManager_1.renderManager.addElementTo(indexHtmlIds.bodyId, mapOverlayMoveLock, priority));
            }
            else {
                pros.push(RenderManager_1.renderManager.appendChildTo(indexHtmlIds.bodyId, mouseEventBlockerScreenOverlayId, priority));
            }
            this.mouseEventBlockerScreenOverlayState = 'active';
        }
        else {
            if (this.mouseEventBlockerScreenOverlayState === 'active') {
                pros.push(RenderManager_1.renderManager.appendChildTo(indexHtmlIds.unplacedElementsId, mouseEventBlockerScreenOverlayId, priority));
                this.mouseEventBlockerScreenOverlayState = 'inactive';
            }
        }
        await Promise.all(pros);
    }
    stringify(object) {
        const visitedObjects = [];
        return JSON.stringify(object, (key, value) => {
            if (value && visitedObjects.includes(value)) {
                return value.toString(); // TODO: getId() if existing
            }
            visitedObjects.push(value);
            return value;
        }, '\t');
    }
    getIndentationDepth(line, numberOfSpacesMatchingOneTab = 2) {
        const spacesForTab = ' '.repeat(numberOfSpacesMatchingOneTab);
        let restLine = line;
        let indentation = 0;
        for (; restLine.length > 0; indentation++) {
            if (restLine.startsWith('\t')) {
                restLine = restLine.substring(1);
                continue;
            }
            else if (restLine.startsWith(spacesForTab)) {
                restLine = restLine.substring(numberOfSpacesMatchingOneTab);
                continue;
            }
            break;
        }
        return indentation;
    }
    consistsOnlyOfEmptySpace(line) {
        return line.match(/^\s*$/) !== null;
    }
    consistsOnlyOfEmptySpaceExcept(line, exception) {
        let escapedException = '';
        for (let char of exception) {
            if (char === '[' || char === ']') {
                escapedException += '\\' + char;
            }
            else {
                escapedException += '[' + char + ']';
            }
        }
        return line.match('^\\s*' + escapedException + '\\s*$') !== null;
    }
    escapeForHtml(text) {
        var content = '';
        for (let i = 0; i < text.length; i++) {
            // TODO this is maybe very inefficient
            content += this.escapeCharForHtml(text[i]);
        }
        return content;
    }
    escapeCharForHtml(c) {
        switch (c) {
            case '\\':
                return '&#92;';
            case '\n':
                return '<br/>';
            case '\r':
                return '';
            case '\'':
                return '&#39;';
            case '"':
                return '&quot;';
            case '`':
                return '&#96;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp';
            default:
                return c;
        }
    }
    // TODO: introduce Path class and move path util methods there
    joinPaths(paths) {
        let jointedPath = '';
        for (let path of paths) {
            path = this.replaceBackslashesWithSlashes(path);
            jointedPath = this.concatPaths(jointedPath, path);
        }
        return jointedPath;
    }
    concatPaths(left, right) {
        if (left === '') {
            return right;
        }
        if (!left.endsWith('/') && !right.startsWith('/')) {
            left += '/';
        }
        else if (left.endsWith('/') && right.startsWith('/')) {
            right = right.substring(1);
        }
        if (right.startsWith('./')) {
            right = right.substring(2);
        }
        while (right.startsWith('../')) {
            left = this.removeLastElementFromPath(left);
            right = right.substring(3);
        }
        return left + right;
    }
    getElementCountOfPath(path) {
        return this.getElementsOfPath(path).length;
    }
    getElementsOfPath(path) {
        let preprocessedPath = path;
        if (path === '/') {
            return ['/'];
        }
        if (path.startsWith('./') && path !== './') {
            preprocessedPath = path.substring(2);
        }
        else if (path.startsWith('/')) {
            preprocessedPath = path.substring(1);
        }
        else {
            preprocessedPath = path.replace(/^[\w]+[:][/][/]/, '');
        }
        if (preprocessedPath.endsWith('/')) {
            preprocessedPath = preprocessedPath.substring(0, preprocessedPath.length - 1);
        }
        const elements = preprocessedPath.split('/');
        if (elements.includes('')) {
            this.logWarning(`Util::getElementsOfPath(..) struggling to interpret path '${path}', filtering out empty elements in '[${elements}]'.`);
            return elements.filter(element => element.length > 0);
        }
        return elements;
    }
    removeStartFromPath(start, path) {
        if (!path.startsWith(start)) {
            logService_1.log.warning(`Util::removeStartFromPath(..) path '${path}' does not start with start '${start}'.`);
        }
        let remainingPath = path.substring(start.length);
        if (remainingPath.startsWith('/') || remainingPath.startsWith('\\')) {
            remainingPath = remainingPath.substring(1);
        }
        return remainingPath;
    }
    removeLastElementFromPath(path) {
        path = this.replaceBackslashesWithSlashes(path);
        return path.replace(/[/][^/]*.$/, '/');
    }
    replaceBackslashesWithSlashes(s) {
        return s.split('\\').join('/');
    }
    matchFileNames(name, otherName, options) {
        if (!options?.ignoreFileEndings) {
            return name === otherName;
        }
        const nameFileEndingIndex = name.lastIndexOf('.');
        const otherNameFileEndingIndex = otherName.lastIndexOf('.');
        const nameWithoutFileEnding = nameFileEndingIndex > 0 ? name.substring(0, nameFileEndingIndex) : name;
        const otherNameWithoutFileEnding = otherNameFileEndingIndex > 0 ? otherName.substring(0, otherNameFileEndingIndex) : otherName;
        return name === otherNameWithoutFileEnding || nameWithoutFileEnding === otherName || nameWithoutFileEnding === otherNameWithoutFileEnding;
    }
    toFormattedJson(object) {
        return JSON.stringify(object, null, '\t');
    }
    wait(milliSeconds) {
        return new Promise((resolve) => setTimeout(resolve, milliSeconds));
    }
    generateId() {
        return Math.random().toString(32).substring(2);
    }
    getCallerDirPath(skipThroughFilePath) {
        if (!skipThroughFilePath) {
            skipThroughFilePath = stacktraceUtil.getCallerFilePath(__filename);
        }
        return stacktraceUtil.getCallerDirPath(skipThroughFilePath);
    }
    getCallerFilePath(skipThroughFilePath) {
        if (!skipThroughFilePath) {
            skipThroughFilePath = stacktraceUtil.getCallerFilePath(__filename);
        }
        return stacktraceUtil.getCallerFilePath(skipThroughFilePath);
    }
    getCallStackPaths() {
        return stacktraceUtil.getCallStackPaths();
    }
}
exports.util = new Util();
