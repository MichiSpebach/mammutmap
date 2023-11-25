import { FolderBox } from '../dist/core/box/FolderBox'
import * as pluginFacade from '../dist/pluginFacade'
import { coreUtil, contextMenu, MenuItemFile, MenuItemFolder, Box, FileBox, renderManager, Link, ProgressBarWidget } from '../dist/pluginFacade'
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
                        {type: 'li', children: 'There is no autoTagger.js plugin yet'},
                        {type: 'li', children: `BorderingLinks with appearance mode 'renderedEnds' are not hidden while hovering box yet.`},
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
    console.log(`Start generating outgoing links recursively of '${folder.getSrcPath()}'...`)
    const progressBar: ProgressBarWidget = await ProgressBarWidget.newAndRenderInMainWidget()
    let totalFileCountingFinished: boolean = false
    let totalFileCount: number = 0
    let fileCount: number = 0
    let foundLinksCount: number = 0
    let foundLinksAlreadyExistedCount: number = 0
    
    const countingFiles: Promise<void> = countFiles()
    
    const iterator = new pluginFacade.FileBoxDepthTreeIterator(folder)
    while (await iterator.hasNextOrUnwatch()) {
        const box: FileBox = await iterator.next()
        fileCount++
        progressBar.setDescription(buildProgressText())
        await generateOutgoingLinksForFile(box, {onLinkAdded: (report) => {
            foundLinksCount += report.linkRoute ? 1 : 0
            foundLinksAlreadyExistedCount += report.linkRouteAlreadyExisted ? 1 : 0
            progressBar.setDescription(buildProgressText())
        }})
    }

    await countingFiles
    await progressBar.finishAndRemove()
    console.log(`Finished ${buildProgressText()}.`)

    async function countFiles(): Promise<void> {
        for (const iterator = new pluginFacade.FileBoxDepthTreeIterator(folder); await iterator.hasNextOrUnwatch(); await iterator.next()) {
            totalFileCount++
            progressBar.setDescription(buildProgressText())
        }
        totalFileCountingFinished = true
    }

    function buildProgressText(): string {
        let text: string = `generating outgoing links recursively: analyzed ${fileCount} of ${totalFileCount} files`
        text += `, found ${foundLinksCount} links, ${foundLinksAlreadyExistedCount} of them already existed`
        const percentText: string = totalFileCountingFinished ? ` (${Math.round(fileCount/totalFileCount * 100)}%)` : ''
        return text+percentText
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

async function generateOutgoingLinksForFile(box: FileBox, options?: {
    onLinkAdded?: (report: {linkRoute: Link[]|undefined, linkRouteAlreadyExisted: boolean, warnings?: string[]}) => void
}): Promise<void> {
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
        if (options?.onLinkAdded) {
            options.onLinkAdded(report)
        }
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
