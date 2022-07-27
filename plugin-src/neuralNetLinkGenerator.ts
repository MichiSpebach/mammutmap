import * as contextMenu from '../dist/contextMenu'
import * as pluginFacade from '../dist/pluginFacade'
import { Box, FileBox } from '../dist/pluginFacade'
import { util } from '../dist/util'
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

    let foundLinksCount: number = 0
    let foundLinksAlreadyExistedCount: number = 0
    await Promise.all(paths.map(async path => {
        const report = await pluginFacade.addLink(box, path, {onlyReturnWarnings: true})
        foundLinksCount += report.link ? 1 : 0
        foundLinksAlreadyExistedCount += report.linkAlreadyExisted ? 1 : 0
    }))

    util.logInfo(`Found ${foundLinksCount} links for '${box.getName()}', ${foundLinksAlreadyExistedCount} of them already existed.`)
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
