"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contextMenu = require("../dist/contextMenu");
const pluginFacade = require("../dist/pluginFacade");
const pathFinder = require("./neuralNetLinkGenerator/pathFinder");
const typeFinder = require("./neuralNetLinkGenerator/typeFinder");
contextMenu.addFileBoxMenuItem((box) => {
    return { label: 'generate outgoing links', action: () => generateOutgoingLinksForBox(box) };
});
async function generateOutgoingLinksForBox(box) {
    const fileContent = await box.getBody().getFileContent();
    let paths = pathFinder.findPaths(fileContent);
    const otherTypesInFolder = getSiblingFileNamesWithoutEndings(box);
    paths = paths.concat(typeFinder.findTypesInText(otherTypesInFolder, fileContent));
    await Promise.all(paths.map(async (path) => {
        await pluginFacade.addLink(box, path, { onlyReturnWarnings: true });
    }));
}
function getSiblingFileNamesWithoutEndings(box) {
    return getSiblings(box).map((sibling) => sibling.getName().split('.')[0]);
}
function getSiblings(box) {
    if (box.isRoot()) {
        return [];
    }
    return box.getParent().getBoxes().filter(other => other !== box);
}
