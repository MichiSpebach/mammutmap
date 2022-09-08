"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluginFacade = require("../dist/pluginFacade");
const pluginFacade_1 = require("../dist/pluginFacade");
const util_1 = require("../dist/util");
const pathFinder = require("./neuralNetLinkGenerator/pathFinder");
const typeFinder = require("./neuralNetLinkGenerator/typeFinder");
pluginFacade_1.contextMenu.addFileBoxMenuItem((box) => {
    return new pluginFacade_1.MenuItemFile({ label: 'generate outgoing links', click: () => generateOutgoingLinksForBox(box) });
});
async function generateOutgoingLinksForBox(box) {
    const fileContent = await box.getBody().getFileContent();
    let paths = pathFinder.findPaths(fileContent);
    const otherTypesInFolder = getSiblingFileNamesWithoutEndings(box);
    paths = paths.concat(typeFinder.findTypesInText(otherTypesInFolder, fileContent));
    let foundLinksCount = 0;
    let foundLinksAlreadyExistedCount = 0;
    await Promise.all(paths.map(async (path) => {
        const report = await pluginFacade.addLink(box, path, { onlyReturnWarnings: true });
        foundLinksCount += report.link ? 1 : 0;
        foundLinksAlreadyExistedCount += report.linkAlreadyExisted ? 1 : 0;
    }));
    util_1.util.logInfo(`Found ${foundLinksCount} links for '${box.getName()}', ${foundLinksAlreadyExistedCount} of them already existed.`);
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
