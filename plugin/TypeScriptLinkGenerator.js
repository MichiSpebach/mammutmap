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
    pluginFacade.getFileBoxes().forEach(function (box) {
        var sourcePath = box.getSrcPath();
        if (sourcePath.endsWith('.ts')) {
            generateOutgoingLinksForFile(box.getSrcPath());
        }
    });
    util.logInfo('generateLinks finished');
}
function generateOutgoingLinksForFile(filePath) {
    var program = ts.createProgram([filePath], {});
    var sourceFile = program.getSourceFile(filePath);
    if (!sourceFile) {
        util.logError('failed to get ' + filePath + ' as SourceFile');
        return; // TODO: compiler does not know that util.logError(..) returns never
    }
    ts.forEachChild(sourceFile, function (node) {
        if (ts.isImportDeclaration(node)) {
            util.logInfo(node.moduleSpecifier.getText(sourceFile));
        }
    });
}
