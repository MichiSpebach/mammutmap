import * as pluginFacade from '../dist/pluginFacade'
import { contextMenu, MenuItemFile, Box, FileBox } from '../dist/pluginFacade'
import { coreUtil } from '../dist/pluginFacade'
import * as pathFinder from './neuralNetLinkGenerator/pathFinder'
import * as typeFinder from './neuralNetLinkGenerator/typeFinder'

contextMenu.addFileBoxMenuItem((box: FileBox) => {
    return new MenuItemFile({label: 'generate outgoing links', click: () => generateOutgoingLinksForBox(box)})
})

async function generateOutgoingLinksForBox(box: FileBox): Promise<void> {
    const fileContent: string = await box.getBody().getFileContent()

    let paths: string[] = pathFinder.findPaths(fileContent)

    if (box.getName().toLowerCase().endsWith('.java')) {
        const otherTypesInFolder: string[] = getSiblingFileNamesWithoutEndings(box)
        paths = paths.concat(typeFinder.findTypesInText(otherTypesInFolder, fileContent))
    }

    let foundLinksCount: number = 0
    let foundLinksAlreadyExistedCount: number = 0
    await Promise.all(paths.map(async path => {
        const report = await pluginFacade.addLink(box, path, {onlyReturnWarnings: true})
        foundLinksCount += report.link ? 1 : 0
        foundLinksAlreadyExistedCount += report.linkAlreadyExisted ? 1 : 0
    }))

    coreUtil.logInfo(`Found ${foundLinksCount} links for '${box.getName()}', ${foundLinksAlreadyExistedCount} of them already existed.`)
}

function getSiblingFileNamesWithoutEndings(box: Box): string[] {
    return getSiblings(box).map((sibling: Box) => {
        const parts: string[] = sibling.getName().split('.')
        if (parts[0].length === 0) {
            return '.'+parts[1]
        }
        return parts[0]
    })
}

function getSiblings(box: Box): Box[] {
    if (box.isRoot()) {
        return []
    }
    return box.getParent().getBoxes().filter(other => other !== box)
}
