"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findBox = void 0;
const Map_1 = require("../Map");
const util_1 = require("../util/util");
async function findBox(path, baseOfPath, options) {
    const rootFolder = getRootFolder();
    if (!rootFolder) {
        return {};
    }
    let warnings = undefined;
    if (looksLikeRelativePath(path)) {
        const report = await findBoxForRelativePath(path, baseOfPath, rootFolder, options);
        warnings = concatWarnings(warnings, report.warnings);
        if (report.boxWatcher) {
            return { boxWatcher: report.boxWatcher, warnings };
        }
    }
    if (looksLikeAbsolutePath(path)) {
        const report = await findBoxForAbsolutePath(path, rootFolder, options);
        warnings = concatWarnings(warnings, report.warnings);
        if (report.boxWatcher) {
            return { boxWatcher: report.boxWatcher, warnings };
        }
    }
    const report = await findBoxForPathThatStartsInTheMiddle(path, baseOfPath, rootFolder, options);
    warnings = concatWarnings(warnings, report.warnings);
    if (report.boxWatcher) {
        return { boxWatcher: report.boxWatcher, warnings };
    }
    if (!looksLikeRelativePath(path)) {
        const report = await findBoxForRelativePath(path, baseOfPath, rootFolder, options);
        warnings = concatWarnings(warnings, report.warnings);
        if (report.boxWatcher) {
            return { boxWatcher: report.boxWatcher, warnings };
        }
    }
    if (!looksLikeAbsolutePath(path)) {
        const report = await findBoxForAbsolutePath(path, rootFolder, options);
        warnings = concatWarnings(warnings, report.warnings);
        if (report.boxWatcher) {
            return { boxWatcher: report.boxWatcher, warnings };
        }
    }
    return { warnings };
}
exports.findBox = findBox;
function getRootFolder() {
    if (!Map_1.map) {
        util_1.util.logWarning('a folder has to be openend before calling boxFinder.findBox(..)');
        return undefined;
    }
    return Map_1.map.getRootFolder();
}
async function findBoxForRelativePath(path, baseOfPath, rootFolder, options) {
    const absolutePath = util_1.util.concatPaths(baseOfPath.getSrcPath(), path);
    let report = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(absolutePath, options);
    let warnings = report.warnings;
    if (!report.boxWatcher) {
        report = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(absolutePath, { ignoreFileEndings: true, onlyReturnWarnings: options?.onlyReturnWarnings });
        warnings = concatWarnings(warnings, report.warnings);
    }
    return { boxWatcher: report.boxWatcher, warnings };
}
async function findBoxForAbsolutePath(path, rootFolder, options) {
    let report = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(path, options);
    let warnings = report.warnings;
    if (!report.boxWatcher) {
        report = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(path, { ignoreFileEndings: true, onlyReturnWarnings: options?.onlyReturnWarnings });
        warnings = concatWarnings(warnings, report.warnings);
    }
    return { boxWatcher: report.boxWatcher, warnings };
}
function looksLikeRelativePath(path) {
    return path.startsWith('./') || path.startsWith('../');
}
function looksLikeAbsolutePath(path) {
    return path.includes(':') || path.includes('//') || path.startsWith('/');
}
async function findBoxForPathThatStartsInTheMiddle(path, baseOfPath, rootFolder, options) {
    let warnings = undefined;
    for (let base = baseOfPath; !base.isRoot(); base = base.getParent()) {
        let report = await base.getBoxBySourcePathAndRenderIfNecessary(path, options);
        warnings = concatWarnings(warnings, report.warnings);
        if (!report.boxWatcher) {
            report = await base.getBoxBySourcePathAndRenderIfNecessary(path, { ignoreFileEndings: true, ...options });
            warnings = concatWarnings(warnings, report.warnings);
        }
        if (report.boxWatcher) {
            return { boxWatcher: report.boxWatcher, warnings };
        }
    }
    return { warnings };
}
function concatWarnings(warnings, otherWarnings) {
    if (!otherWarnings) {
        return warnings;
    }
    return warnings?.concat(otherWarnings);
}
