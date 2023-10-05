"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileBoxBody = void 0;
const util_1 = require("../util/util");
const fileSystemAdapter_1 = require("../fileSystemAdapter");
const RenderManager_1 = require("../RenderManager");
const BoxBody_1 = require("./BoxBody");
const styleAdapter_1 = require("../styleAdapter");
class FileBoxBody extends BoxBody_1.BoxBody {
    constructor(referenceBox) {
        super(referenceBox);
        this.referenceFileBox = referenceBox;
    }
    getContentId() {
        return this.getId() + 'Content';
    }
    async executeRender() {
        if (this.isRendered()) {
            return;
        }
        const normalizedFileName = this.referenceFileBox.getName().toLowerCase();
        try {
            // TODO: make something like this work: getImageType().startsWith('image/')
            if (normalizedFileName.endsWith('.png') || normalizedFileName.endsWith('.jpg') || normalizedFileName.endsWith('.svg')) {
                this.setContent(await this.formHtmlContentForImage());
            }
            else {
                this.setContent(await this.formHtmlContentForTextFile());
            }
        }
        catch (error) {
            this.setContent(this.formHtmlContentForError(error));
        }
    }
    async setContent(content) {
        await RenderManager_1.renderManager.setContentTo(this.getId(), content);
    }
    async executeUnrenderIfPossible() {
        if (!this.isRendered()) {
            return { anyChildStillRendered: false };
        }
        await RenderManager_1.renderManager.remove(this.getContentId());
        return { anyChildStillRendered: false };
    }
    async formHtmlContentForImage() {
        return `<img id="${this.getContentId()}" style="width:100%;" src="${util_1.util.escapeForHtml(this.referenceFileBox.getSrcPath())}">`;
    }
    async formHtmlContentForTextFile() {
        const maxFileSizeInKiloBytes = 100; // TODO: add setting for this
        const fileStats = await fileSystemAdapter_1.fileSystem.getDirentStatsOrThrow(this.referenceFileBox.getSrcPath());
        if (fileStats.size / 1000 > maxFileSizeInKiloBytes) {
            const tooLargeHint = 'File is too large to be displayed as textfile';
            const sizeHint = `(${fileStats.size / 1000} kilobytes, maximum is ${maxFileSizeInKiloBytes} kilobytes)`;
            const pluginHint = 'Install or write a plugin to display it.'; // TODO: add hyperlink to plugin tutorial
            return this.formHtmlContentForError(`${tooLargeHint} ${sizeHint}.<br>${pluginHint}`);
        }
        const data = await this.getFileContent();
        const mostImportantLines = this.extractMostImportantLines(data, 20, 10);
        const dataConvertedToHtml = util_1.util.escapeForHtml(mostImportantLines);
        return `<pre id="${this.getContentId()}" class="${styleAdapter_1.style.getFileBoxBodyTextClass()}">${dataConvertedToHtml}</pre>`;
    }
    getFileContent() {
        return fileSystemAdapter_1.fileSystem.readFile(this.referenceFileBox.getSrcPath());
    }
    extractMostImportantLines(code, roughNumberOfLines, minNumberOfLines) {
        let mostImportantLines = [];
        const lines = this.extractLines(code);
        for (let indentation = 0; indentation < 3 && mostImportantLines.length < roughNumberOfLines; indentation++) {
            const importantLines = this.extractLinesWithLowIndentation(lines, indentation);
            if (importantLines.length > minNumberOfLines || Math.abs(importantLines.length - roughNumberOfLines) < Math.abs(mostImportantLines.length - roughNumberOfLines)) {
                mostImportantLines = importantLines;
            }
        }
        return mostImportantLines.reduce((lines, line) => lines + line, '');
    }
    extractLines(code) {
        const lines = [];
        let startLineIndex = 0;
        for (let index = 0; index < code.length; index++) {
            const char = code[index];
            if (char === '\n' || index === code.length - 1) {
                lines.push(code.substring(startLineIndex, index + 1));
                startLineIndex = index + 1;
            }
        }
        return lines;
    }
    extractLinesWithLowIndentation(lines, maxIndentationDepth) {
        let mostImportantLines = [];
        let latestImportantLine = undefined;
        for (const line of lines) {
            if (util_1.util.consistsOnlyOfEmptySpace(line)) {
                if (!latestImportantLine) {
                    continue;
                }
                else if (util_1.util.consistsOnlyOfEmptySpace(latestImportantLine)) {
                    continue;
                }
            }
            else if (util_1.util.getIndentationDepth(line) > maxIndentationDepth) {
                continue;
            }
            if (line.startsWith('import')) {
                continue;
            }
            if (util_1.util.consistsOnlyOfEmptySpaceExcept(line, '}')) {
                if (latestImportantLine && util_1.util.consistsOnlyOfEmptySpace(latestImportantLine)) {
                    mostImportantLines.pop();
                    latestImportantLine = mostImportantLines[mostImportantLines.length - 1];
                }
                if (latestImportantLine && latestImportantLine.match(/{\s*$/)) {
                    mostImportantLines[mostImportantLines.length - 1] = latestImportantLine.replace(/{\s*$/, '\n');
                    continue;
                }
            }
            latestImportantLine = line;
            mostImportantLines.push(line);
        }
        return mostImportantLines;
    }
    formHtmlContentForError(errorMessage) {
        return `<div id="${this.getContentId()}" class="${styleAdapter_1.style.getFileBoxBodyTextClass()}" style="color:red;">${errorMessage}</div>`;
    }
}
exports.FileBoxBody = FileBoxBody;
