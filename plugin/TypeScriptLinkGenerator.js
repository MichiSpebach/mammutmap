"use strict";
exports.__esModule = true;
var ts = require("typescript");
var electron_1 = require("electron");
var util = require("../dist/util");
var applicationMenu = require("../dist/applicationMenu");
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new electron_1.MenuItem({ label: 'Generate links', click: generateLinks }));
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new electron_1.MenuItem({ label: 'Join on GitHub (coming soon)' }));
function generateLinks() {
    util.logInfo('generateLinks');
    var rootFilePath = 'src/index.ts';
    var program = ts.createProgram([rootFilePath], {});
    var sourceFile = program.getSourceFile(rootFilePath);
    if (!sourceFile) {
        util.logError('failed to get ' + rootFilePath + ' as SourceFile');
        return; // TODO: compiler does not know that util.logError(..) returns never
    }
    ts.forEachChild(sourceFile, function (node) {
        if (ts.isImportDeclaration(node)) {
            util.logInfo(node.moduleSpecifier.getText(sourceFile));
        }
    });
    util.logInfo('generateLinks finished');
}
