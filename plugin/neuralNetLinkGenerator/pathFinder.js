"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPaths = void 0;
function findPaths(text) {
    let paths = [];
    paths = paths.concat(findPathsWithMarkers(text, '^', '/', '', '\\s;'));
    paths = paths.concat(findPathsWithMarkers(text, '\\s', '/', '', '\\s;').map(path => path.trim()));
    paths = paths.concat(findPathsWithMarkers(text, "'", '/', "'"));
    paths = paths.concat(findPathsWithMarkers(text, '"', '/', '"'));
    paths = paths.concat(findPathsWithMarkersAndNormalize(text, '^', '\\', '', '\\s;'));
    paths = paths.concat(findPathsWithMarkersAndNormalize(text, '\\s', '\\', '', '\\s;').map(path => path.trim()));
    paths = paths.concat(findPathsWithMarkersAndNormalize(text, "'", '\\', "'"));
    paths = paths.concat(findPathsWithMarkersAndNormalize(text, '"', '\\', '"'));
    paths = paths.concat(findPathsWithMarkersAndNormalize(text, 'import ', '.', '', '\\s\\*;'));
    return paths;
}
exports.findPaths = findPaths;
function findPathsWithMarkersAndNormalize(text, start, separator, end, additionalForbiddings) {
    return findPathsWithMarkers(text, start, separator, end, additionalForbiddings).map(path => path.replaceAll(separator, '/'));
}
function findPathsWithMarkers(text, start, separator, end, additionalForbiddings = '') {
    const paths = [];
    const forbiddings = `'"/\\\\${additionalForbiddings}`;
    const pathElement = `[^${forbiddings}]*[\\${separator}][^${forbiddings}]*`;
    const pathMatches = text.matchAll(new RegExp(`${start}(?:${pathElement})+${end}`, 'g'));
    for (const pathMatch of pathMatches) {
        let path = pathMatch.toString();
        if (path.startsWith(start)) {
            path = path.substring(start.length);
        }
        if (path.endsWith(end)) {
            path = path.substring(0, path.length - end.length);
        }
        if (path.length > 1) {
            paths.push(path);
        }
    }
    return paths;
}
