import { FolderBox } from '../dist/core/box/FolderBox'
import * as pluginFacade from '../dist/pluginFacade'
import { contextMenu, MenuItemFile, MenuItemFolder, Box, FileBox } from '../dist/pluginFacade'
import { coreUtil } from '../dist/pluginFacade'
import * as pathFinder from './neuralNetLinkGenerator/pathFinder'
import * as typeFinder from './neuralNetLinkGenerator/typeFinder'

contextMenu.addFileBoxMenuItem((box: FileBox) => {
    return new MenuItemFile({label: 'generate outgoing links', click: () => generateOutgoingLinksForFile(box)})
})
contextMenu.addFolderBoxMenuItem((box: FolderBox) => {
    return new MenuItemFolder({label: 'generate outgoing links', submenu: [
        new MenuItemFile({label: 'for files in this folder only', click: () => generateOutgoingLinksForAllFilesInFolder(box)}),
        new MenuItemFile({label: 'recursively...', click: () => openDialogForGenerateOutgoingLinksRecursively(box)})
    ]})
})

async function openDialogForGenerateOutgoingLinksRecursively(folder: FolderBox): Promise<void> {
    const popup: pluginFacade.PopupWidget = await pluginFacade.PopupWidget.newAndRender({title: 'Generate Outgoing Links Recursively', content: [
        {type: 'div', style: {marginTop: '8px'}, children: 'Are you sure?'},
        {
            type: 'ul',
            children: [
                {type: 'li', children: 'This may take a while (depending on how many files there are)'},
                {type: 'li', children: 'Lots of links may be added that are more confusing than helping because:'},
                {
                    type: 'ul',
                    children: [
                        {type: 'li', children: 'There is no linkBundler.js plugin yet'},
                        {type: 'li', children: 'There is no boxOrderer.js plugin yet'},
                        {type: 'li', children: 'There is no autoTagger.js plugin yet'}
                    ]
                }
            ]
        },
        {
            type: 'button', 
            children: `Yes, bring in on!`, 
            onclick: () => {
                generateOutgoingLinksRecursively(folder)
                popup.unrender()
            }
        }
    ]})
}

async function generateOutgoingLinksRecursively(folder: FolderBox): Promise<void> {
    const iterator = new pluginFacade.FileBoxDepthTreeIterator(folder)
    while (await iterator.hasNext()) {
        const box: FileBox = await iterator.next()
        await generateOutgoingLinksForFile(box)
    }
}

async function generateOutgoingLinksForAllFilesInFolder(folder: FolderBox): Promise<void> {
    for (const box of folder.getChilds()) {
        if (!(box instanceof FileBox)) {
            continue
        }
        await generateOutgoingLinksForFile(box)
    }
}

async function generateOutgoingLinksForFile(box: FileBox): Promise<void> {
    const fileContent: string = await box.getBody().getFileContent()

    let paths: string[] = pathFinder.findPaths(fileContent)

    if (box.getName().toLowerCase().endsWith('.java')) {
        const otherTypesInFolder: string[] = getSiblingFileNamesWithoutEndings(box)
        paths = paths.concat(typeFinder.findTypesInText(otherTypesInFolder, fileContent))
    }

    let foundLinksCount: number = 0
    let foundLinksAlreadyExistedCount: number = 0
    await Promise.all(paths.map(async path => {
        const report = await pluginFacade.addLink(box, path, {onlyReturnWarnings: true, delayUnwatchingOfBoxesInMS: 500})
        foundLinksCount += report.linkRoute ? 1 : 0
        foundLinksAlreadyExistedCount += report.linkRouteAlreadyExisted ? 1 : 0
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
