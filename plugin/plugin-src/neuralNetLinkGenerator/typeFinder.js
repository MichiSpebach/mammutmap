"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTypesInText = void 0;
function findTypesInText(types, text) {
    const foundTypes = [];
    for (const type of types) {
        const typeMatches = text.matchAll(new RegExp(`(?:^|[^\\w])(?:${type})(?:[^\\w]|$)`, 'g'));
        for (const typeMatch of typeMatches) {
            let foundType = typeMatch.toString();
            if (foundType.match(new RegExp('^[^\\w]'))) {
                foundType = foundType.substring(1);
            }
            if (foundType.match(new RegExp('[^\\w]$'))) {
                foundType = foundType.substring(0, foundType.length - 1);
            }
            if (!foundTypes.includes(foundType)) {
                foundTypes.push(foundType);
            }
        }
    }
    return foundTypes;
}
exports.findTypesInText = findTypesInText;
