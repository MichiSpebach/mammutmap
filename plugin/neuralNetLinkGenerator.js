"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const contextMenu = require("../dist/contextMenu");
const pluginFacade = require("../dist/pluginFacade");
const pathFinder = require("./neuralNetLinkGenerator/pathFinder");
contextMenu.addFileBoxMenuItem((box) => {
    return { label: 'generate outgoing links', action: () => generateOutgoingLinksForBox(box) };
});
async function generateOutgoingLinksForBox(box) {
    const fileContent = await box.getBody().getFileContent();
    const paths = pathFinder.findPaths(fileContent);
    await Promise.all(paths.map(async (path) => {
        await pluginFacade.addLink(box, path);
    }));
}
