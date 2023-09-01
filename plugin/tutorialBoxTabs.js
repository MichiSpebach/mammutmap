"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const pluginFacade_1 = require("../dist/pluginFacade");
pluginFacade_1.applicationMenu.addMenuItemTo('tutorialBoxTabs.js', new pluginFacade_1.MenuItemFile({ label: 'activate', click: () => activate() }));
function activate() {
    pluginFacade_1.Box.Tabs.register({
        name: 'TutorialBoxTabs',
        isAvailableFor: (box) => box.isFile(),
        buildWidget: (box) => buildTabFor(box)
    });
}
async function buildTabFor(box) {
    if (!(box instanceof pluginFacade_1.FileBox)) {
        console.warn(`tutorialBoxTabs: Box with path '${box.getSrcPath()}' does not represent a file.`);
        return {
            type: 'div',
            style: { color: 'red' },
            children: 'Box does not represent a file.'
        };
    }
    const fileContent = await box.getBody().getFileContent();
    return {
        type: 'div',
        children: `There are ${fileContent.length} letters in this file.`
    };
}
