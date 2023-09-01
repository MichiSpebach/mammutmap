import { Box, FileBox, MenuItemFile, RenderElement, applicationMenu } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('tutorialBoxTabs.js', new MenuItemFile({label: 'activate', click: () => activate()}))

function activate(): void {
    Box.Tabs.register({
        name: 'TutorialBoxTabs',
        isAvailableFor: (box: Box) => box.isFile(),
        buildWidget: (box: Box) => buildTabFor(box)
    })
}

async function buildTabFor(box: Box): Promise<RenderElement> {
    if (!(box instanceof FileBox)) {
        console.warn(`tutorialBoxTabs: Box with path '${box.getSrcPath()}' does not represent a file.`)
        return {
            type: 'div',
            style: {color: 'red'},
            children: 'Box does not represent a file.'
        }
    }

    const fileContent: string = await box.getBody().getFileContent()
    return {
        type: 'div',
        children: `There are ${fileContent.length} letters in this file.`
    }
}