import * as contextMenu from '../dist/contextMenu'
import * as pluginFacade from '../dist/pluginFacade'
import { Box, FileBox } from '../dist/pluginFacade'
import * as pathFinder from './neuralNetLinkGenerator/pathFinder'
import * as typeFinder from './neuralNetLinkGenerator/typeFinder'

contextMenu.addFileBoxMenuItem((box: FileBox) => {
    return {label: 'generate outgoing links', action: () => generateOutgoingLinksForBox(box)}
})

async function generateOutgoingLinksForBox(box: FileBox): Promise<void> {
    const fileContent: string = await box.getBody().getFileContent()

    let paths: string[] = pathFinder.findPaths(fileContent)

    const otherTypesInFolder: string[] = getSiblingFileNamesWithoutEndings(box)
    paths = paths.concat(typeFinder.findTypesInText(otherTypesInFolder, fileContent))

    await Promise.all(paths.map(async path => {
        await pluginFacade.addLink(box, path, {onlyReturnWarnings: true})
    }))
}

function getSiblingFileNamesWithoutEndings(box: Box): string[] {
    return getSiblings(box).map((sibling: Box) => sibling.getName().split('.')[0])
}

function getSiblings(box: Box): Box[] {
    if (box.isRoot()) {
        return []
    }
    return box.getParent().getBoxes().filter(other => other !== box)
}
