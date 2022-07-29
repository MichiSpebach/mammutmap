"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPaths = void 0;
function findPaths(text) {
    let paths = [];
    concatToPathsIfNotIncluded(paths, findPathsWithMarkers(text, '^', '/', '\\s;'));
    concatToPathsIfNotIncluded(paths, findPathsWithMarkers(text, '\\s', '/', '\\s;').map(path => path.trim()));
    concatToPathsIfNotIncluded(paths, findPathsWithMarkers(text, "'", '/', '', "'"));
    concatToPathsIfNotIncluded(paths, findPathsWithMarkers(text, '"', '/', '', '"'));
    concatToPathsIfNotIncluded(paths, findPathsWithMarkersAndNormalize(text, '^', '\\', '\\s;'));
    concatToPathsIfNotIncluded(paths, findPathsWithMarkersAndNormalize(text, '\\s', '\\', '\\s;').map(path => path.trim()));
    concatToPathsIfNotIncluded(paths, findPathsWithMarkersAndNormalize(text, "'", '\\', '', "'"));
    concatToPathsIfNotIncluded(paths, findPathsWithMarkersAndNormalize(text, '"', '\\', '', '"'));
    concatToPathsIfNotIncluded(paths, findPathsWithMarkersAndNormalize(text, 'import ', '.', '\\s\\*;'));
    return paths;
}
exports.findPaths = findPaths;
function concatToPathsIfNotIncluded(paths, otherPaths) {
    for (const otherPath of otherPaths) {
        if (!paths.includes(otherPath)) {
            paths.push(otherPath);
        }
    }
}
function findPathsWithMarkersAndNormalize(text, start, separator, additionalForbiddings, end) {
    return findPathsWithMarkers(text, start, separator, additionalForbiddings, end).map(path => path.replaceAll(separator, '/'));
}
function findPathsWithMarkers(text, start, separator, additionalForbiddings = '', end) {
    // there is no neural net yet, for now the name just stays as buzzword xD
    const paths = [];
    const forbiddings = `'"/\\\\\n${additionalForbiddings}`;
    const pathElement = `[^${forbiddings}]*[\\${separator}][^${forbiddings}]*`;
    const suffixCaptor = '(.|\\s|$)'; // using capturing group that matches everything to avoid catastrophic backtracking
    const pathMatches = text.matchAll(new RegExp(`${start}(?:${pathElement})+${suffixCaptor}`, 'g'));
    for (const pathMatch of pathMatches) {
        let path = pathMatch[0];
        let suffix = pathMatch[1];
        if (end && end !== suffix) {
            continue;
        }
        if (path.startsWith(start)) {
            path = path.substring(start.length);
        }
        if (path.endsWith(suffix)) {
            path = path.substring(0, path.length - suffix.length);
        }
        if (path.length > 1) {
            paths.push(path);
        }
    }
    return paths;
}
