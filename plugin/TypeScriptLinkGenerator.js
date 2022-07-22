"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const electron_1 = require("electron");
const util_1 = require("../dist/util");
const applicationMenu = require("../dist/applicationMenu");
const contextMenu = require("../dist/contextMenu");
const pluginFacade = require("../dist/pluginFacade");
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new electron_1.MenuItem({ label: 'Generate links', click: generateLinks }));
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new electron_1.MenuItem({ label: 'Join on GitHub (coming soon)' }));
contextMenu.addFileBoxMenuItem((box) => {
    if (!box.getName().endsWith('.ts')) {
        return undefined;
    }
    return { label: 'generate outgoing links', action: async () => {
            await generateOutgoingLinksForBoxes([box]);
            await pluginFacade.clearWatchedBoxes(); // TODO: potential bug, clears all boxWatchers not only the ones that were added
        } };
});
async function generateLinks() {
    util_1.util.logInfo('generateLinks');
    const boxes = pluginFacade.getFileBoxIterator();
    let boxChunk = []; // calling ts.createProgram(..) with many files is magnitude faster than calling many times with one file
    while (await boxes.hasNext()) {
        const box = await boxes.next();
        if (box.getSrcPath().endsWith('.ts')) {
            boxChunk.push(box);
        }
        if (boxChunk.length > 31) {
            await generateOutgoingLinksForBoxes(boxChunk);
            boxChunk = [];
        }
    }
    util_1.util.logInfo('generateLinks finished');
}
async function generateOutgoingLinksForBoxes(boxes) {
    const filePaths = boxes.map(box => box.getSrcPath());
    const program = ts.createProgram(filePaths, {}); // TODO: blocks for about a second, use workers and run in other thread
    for (const box of boxes) {
        await generateOutgoingLinksForBox(box, program);
    }
}
async function generateOutgoingLinksForBox(box, program) {
    const filePath = box.getSrcPath();
    util_1.util.logInfo('generate outgoing links for file ' + filePath);
    const sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
        util_1.util.logError('failed to get ' + filePath + ' as SourceFile');
    }
    const parentFilePath = box.getParent().getSrcPath();
    const importPaths = extractImportPaths(sourceFile);
    await addLinks(filePath, parentFilePath, importPaths);
}
function extractImportPaths(sourceFile) {
    const importPaths = [];
    ts.forEachChild(sourceFile, node => {
        if (ts.isImportDeclaration(node)) {
            let importPath = node.moduleSpecifier.getText(sourceFile);
            importPaths.push(importPath);
        }
    });
    return importPaths;
}
async function addLinks(fromFilePath, parentFilePath, relativeToFilePaths) {
    for (let importPath of relativeToFilePaths) {
        if (isImportFromLibrary(importPath)) {
            continue;
        }
        const normalizedImportPath = normalizeRelativeImportPath(importPath);
        const normalizedToFilePath = util_1.util.concatPaths(parentFilePath, normalizedImportPath);
        await pluginFacade.addLink(fromFilePath, normalizedToFilePath);
    }
}
function isImportFromLibrary(importPath) {
    return !importPath.includes('/');
}
function normalizeRelativeImportPath(path) {
    path = path.replaceAll('\'', '');
    path = path.replaceAll('"', '');
    if (!path.endsWith('.ts')) {
        path += '.ts';
    }
    return path;
}
