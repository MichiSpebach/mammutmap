"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var ts = require("typescript");
var electron_1 = require("electron");
var util = require("../dist/util");
var applicationMenu = require("../dist/applicationMenu");
var pluginFacade = require("../dist/pluginFacade");
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new electron_1.MenuItem({ label: 'Generate links', click: generateLinks }));
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new electron_1.MenuItem({ label: 'Join on GitHub (coming soon)' }));
function generateLinks() {
    return __awaiter(this, void 0, void 0, function () {
        var boxes, box, sourcePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    util.logInfo('generateLinks');
                    boxes = pluginFacade.getFileBoxIterator();
                    _a.label = 1;
                case 1:
                    if (!boxes.hasNext()) return [3 /*break*/, 4];
                    box = boxes.next();
                    sourcePath = box.getSrcPath();
                    if (!sourcePath.endsWith('.ts')) return [3 /*break*/, 3];
                    return [4 /*yield*/, generateOutgoingLinksForBox(box)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [3 /*break*/, 1];
                case 4:
                    util.logInfo('generateLinks finished');
                    return [2 /*return*/];
            }
        });
    });
}
function generateOutgoingLinksForBox(box) {
    return __awaiter(this, void 0, void 0, function () {
        var filePath, program, sourceFile, parentFilePath, importPaths;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filePath = box.getSrcPath();
                    util.logInfo('generate outgoing links for file ' + filePath);
                    return [4 /*yield*/, util.wait(0)]; // unblocks main-thread // TODO: still blocks too much, use workers and run in other thread
                case 1:
                    _a.sent(); // unblocks main-thread // TODO: still blocks too much, use workers and run in other thread
                    program = ts.createProgram([filePath], {});
                    sourceFile = program.getSourceFile(filePath);
                    if (!sourceFile) {
                        util.logError('failed to get ' + filePath + ' as SourceFile');
                        return [2 /*return*/]; // TODO: compiler does not know that util.logError(..) returns never
                    }
                    parentFilePath = box.getParent().getSrcPath();
                    importPaths = extractImportPaths(sourceFile);
                    return [4 /*yield*/, addLinks(filePath, parentFilePath, importPaths)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function extractImportPaths(sourceFile) {
    var importPaths = [];
    ts.forEachChild(sourceFile, function (node) {
        if (ts.isImportDeclaration(node)) {
            var importPath = node.moduleSpecifier.getText(sourceFile);
            importPaths.push(importPath);
        }
    });
    return importPaths;
}
function addLinks(fromFilePath, parentFilePath, relativeToFilePaths) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, relativeToFilePaths_1, importPath, normalizedImportPath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, relativeToFilePaths_1 = relativeToFilePaths;
                    _a.label = 1;
                case 1:
                    if (!(_i < relativeToFilePaths_1.length)) return [3 /*break*/, 4];
                    importPath = relativeToFilePaths_1[_i];
                    normalizedImportPath = normalizeRelativeImportPath(importPath);
                    return [4 /*yield*/, pluginFacade.addLink(fromFilePath, parentFilePath + '/' + normalizedImportPath)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
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
