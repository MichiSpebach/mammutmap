"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculatePathOfUnchangedLinkEndOfChangedLink = void 0;
const util_1 = require("../util/util");
function calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, shallowRenderedPath) {
    if (shallowRenderedPath.length === 0) {
        util_1.util.logWarning('Something is off, shallowRenderedPath is empty, this should never happen.');
    }
    const newPath = [];
    let remainingOldPath = oldPath;
    let deepestCommonWayPoint = undefined;
    for (let renderedWayPoint of shallowRenderedPath) {
        let newWayPoint = renderedWayPoint;
        for (let oldWayPoint of remainingOldPath) {
            if (renderedWayPoint.boxId === oldWayPoint.boxId) {
                newWayPoint = oldWayPoint;
                deepestCommonWayPoint = oldWayPoint;
                remainingOldPath = remainingOldPath.slice(remainingOldPath.indexOf(oldWayPoint) + 1);
                break;
            }
        }
        newPath.push(newWayPoint);
    }
    if (deepestCommonWayPoint !== newPath[newPath.length - 1]) {
        util_1.util.logWarning('Something is off, deepest rendered WayPoint of shallowRenderedPath is not contained in oldPath, this should never happen.');
    }
    newPath.push(...remainingOldPath);
    return newPath;
}
exports.calculatePathOfUnchangedLinkEndOfChangedLink = calculatePathOfUnchangedLinkEndOfChangedLink;
