"use strict";
exports.__esModule = true;
var ts = require("typescript");
var electron_1 = require("electron");
var util = require("../dist/util");
var applicationMenu = require("../dist/applicationMenu");
var pluginFacade = require("../dist/pluginFacade");
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new electron_1.MenuItem({ label: 'Generate links', click: generateLinks }));
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new electron_1.MenuItem({ label: 'Join on GitHub (coming soon)' }));
function generateLinks() {
    util.logInfo('generateLinks');
    var boxes = pluginFacade.getFileBoxIterator();
    while (boxes.hasNext()) {
        var box = boxes.next();
        var sourcePath = box.getSrcPath();
        if (sourcePath.endsWith('.ts')) {
            generateOutgoingLinksForBox(box);
        }
    }
    util.logInfo('generateLinks finished');
}
function generateOutgoingLinksForBox(box) {
    var filePath = box.getSrcPath();
    util.logInfo('generate outgoing links for file ' + filePath);
    var program = ts.createProgram([filePath], {});
    var sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
        util.logError('failed to get ' + filePath + ' as SourceFile');
        return; // TODO: compiler does not know that util.logError(..) returns never
    }
    var parentFilePath = box.getParent().getSrcPath();
    ts.forEachChild(sourceFile, function (node) {
        if (ts.isImportDeclaration(node)) {
            var relativeToPath = node.moduleSpecifier.getText(sourceFile);
            relativeToPath = normalizeRelativeImportPath(relativeToPath);
            pluginFacade.addLink(filePath, parentFilePath + '/' + relativeToPath);
        }
    });
}
function normalizeRelativeImportPath(path) {
    path = path.replaceAll('\'', '');
    path = path.replaceAll('"', '');
    if (!path.endsWith('.ts')) {
        path += '.ts';
    }
    if (path.startsWith('./')) {
        path = path.substring(2);
    }
    return path;
}
