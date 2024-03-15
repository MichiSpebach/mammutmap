import {Box, getRootFolder, renderManager} from '../../dist/pluginFacade'
import {isSubPathOrEqual} from './pathUtil'
import {ChangedFile} from './GitClient'

let isInitialized: boolean = false
let currentFiles: ChangedFile[] = []
let lastFiles: ChangedFile[] = []
let forceRestyle: boolean = false

function getFileForBox(box: Box, files: ChangedFile[]): ChangedFile | undefined {
    return files.find(file =>
        isSubPathOrEqual(file.absolutePath, box.getSrcPath()));
}

function initializeBoxHighlighting(): void {
    if (isInitialized) {
        return
    }
    isInitialized = true
    const renderBackup = Box.prototype.render
    Box.prototype.render = async function () {
        const isRendered: boolean = this.isRendered() // store if rendered, because renderBackup.call sets it true
        await renderBackup.call(this)
        const lastFile: ChangedFile | undefined = getFileForBox(this, lastFiles)
        if (lastFile !== undefined && forceRestyle) {
            await removeCurrentHighlighting(this)
        }
        const currentFile: ChangedFile | undefined = getFileForBox(this, currentFiles)
        if (currentFile !== undefined && (!isRendered || forceRestyle)) {
            await highlightBox(this, currentFile)
        }
    }
}

export async function highlightBoxes(changedFiles: ChangedFile[]): Promise<void> {
    currentFiles = changedFiles
    initializeBoxHighlighting()
    forceRestyle = true
    await getRootFolder().render()
    forceRestyle = false
    lastFiles = currentFiles
}

async function highlightBox(box: Box, changedFile: ChangedFile): Promise<void> {
    const borderColor = decideBorderColor(changedFile)
    await renderManager.addStyleTo(`${box.getId()}Border`, {
        borderColor: borderColor,
        borderWidth: '4.2px'
    })
    // renderManager.addElementTo(`${box.getId()}Border`, {
    //     type: 'div',
    //     children: '+-+-+-+-+-+-+-'.repeat(420),
    //     style: { color: 'green' }
    // })
}

function decideBorderColor(changedFile: ChangedFile): string {
    const diffCount: number = changedFile.numberOfAddedLines - changedFile.numberOfDeletedLines
    const borderColorThreshold = 42;
    if (diffCount > borderColorThreshold) {
        return 'green'
    } else if (diffCount < -borderColorThreshold) {
        return 'red'
    }
    return 'yellow'
}

async function removeCurrentHighlighting(box: Box): Promise<void> {
    await renderManager.addStyleTo(`${box.getId()}Border`, {
        borderColor: null,
        borderWidth: null
    })
}