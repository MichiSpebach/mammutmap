"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts = require("typescript");
const pluginFacade_1 = require("../dist/pluginFacade");
const util_1 = require("../dist/util");
const pluginFacade = require("../dist/pluginFacade");
pluginFacade_1.applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new pluginFacade_1.MenuItemFile({ label: 'Generate links', click: generateLinks }));
pluginFacade_1.applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new pluginFacade_1.MenuItemFile({ label: 'Join on GitHub (coming soon)', click: () => util_1.util.logInfo('Join on GitHub is coming soon') }));
pluginFacade_1.contextMenu.addFileBoxMenuItem((box) => {
    if (!box.getName().endsWith('.ts')) {
        return undefined;
    }
    return new pluginFacade_1.MenuItemFile({ label: 'generate outgoing ts links', click: async () => {
            await generateOutgoingLinksForBoxes([box]);
            await pluginFacade.clearWatchedBoxes(); // TODO: potential bug, clears all boxWatchers not only the ones that were added
        } });
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
    const importPaths = extractImportPaths(sourceFile);
    await addLinks(box, importPaths);
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
async function addLinks(fromBox, relativeToFilePaths) {
    let foundLinksCount = 0;
    let foundLinksAlreadyExistedCount = 0;
    for (let relativeToFilePath of relativeToFilePaths) {
        if (isImportFromLibrary(relativeToFilePath)) {
            continue;
        }
        const normalizedRelativeToFilePath = normalizeRelativeImportPath(relativeToFilePath);
        const report = await pluginFacade.addLink(fromBox, normalizedRelativeToFilePath, { registerBoxWatchersInsteadOfUnwatch: true });
        foundLinksCount += report.link ? 1 : 0;
        foundLinksAlreadyExistedCount += report.linkAlreadyExisted ? 1 : 0;
    }
    util_1.util.logInfo(`Found ${foundLinksCount} links for '${fromBox.getName()}', ${foundLinksAlreadyExistedCount} of them already existed.`);
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
