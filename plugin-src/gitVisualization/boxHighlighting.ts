import {Box, getRootFolder, renderManager} from '../../dist/pluginFacade'
import {isSubPathOrEqual} from './pathUtil'
import {ChangedFile} from './GitClient'

let isInitialized: boolean = false
let currentFiles: ChangedFile[] = []
let lastFiles: ChangedFile[] = []
let forceRestyle: boolean = false

const ADDITION_COLOR = 'darkgreen'
const DELETION_COLOR = 'darkred'

function getFilesForBox(box: Box, files: ChangedFile[]): ChangedFile[] {
    return files.filter(file => isSubPathOrEqual(file.absolutePath, box.getSrcPath()))
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
        const lastFilesForBox: ChangedFile[] = getFilesForBox(this, lastFiles)
        if (lastFilesForBox.length > 0 && forceRestyle) {
            await removeCurrentHighlighting(this)
        }
        const changedFilesForBox: ChangedFile[] = getFilesForBox(this, currentFiles)
        if (changedFilesForBox.length > 0 && (!isRendered || forceRestyle)) {
            if (this.isFolder()) {
                await highlightFolderBox(this, changedFilesForBox)
            } else {
                await highlightBox(this, changedFilesForBox[0])
            }
        }
    }
}

async function highlightFolderBox(box: Box, changedFilesInFolder: ChangedFile[]) {
    let numberOfAddedLines: number = 0
    let numberOfDeletedLines: number = 0
    for (const changedFile of changedFilesInFolder) {
        numberOfAddedLines += changedFile.numberOfAddedLines
        numberOfDeletedLines += changedFile.numberOfDeletedLines
    }
    await highlightBox(box, {
        absolutePath: box.getSrcPath(),
        numberOfAddedLines: numberOfAddedLines,
        numberOfDeletedLines: numberOfDeletedLines
    })
}

export async function highlightBoxes(changedFiles: ChangedFile[]): Promise<void> {
    currentFiles = changedFiles
    initializeBoxHighlighting()
    forceRestyle = true
    await getRootFolder().render()
    forceRestyle = false
    lastFiles = currentFiles
}

async function highlightBox(box: Box, changedFileOrFolder: ChangedFile): Promise<void> {
    const borderColor = decideBorderColor(changedFileOrFolder)
    await renderManager.addStyleTo(borderId(box), {
        borderColor: borderColor,
        borderWidth: '4.2px'
    })
    await renderManager.addElementTo(borderId(box), {
        id: `${borderId(box)}Content`,
        type: 'div',
        children: [{
            type: 'span',
            innerHTML: `<strong>${changedFileOrFolder.numberOfAddedLines}+</strong> `,
            style: {color: ADDITION_COLOR}
        }, {
            type: 'span',
            innerHTML: `<strong>${changedFileOrFolder.numberOfDeletedLines}-</strong> `,
            style: {color: DELETION_COLOR}
        }],
        style: {float: 'right'}
    })
}

function decideBorderColor(changedFile: ChangedFile): string {
    const diffCount: number = changedFile.numberOfAddedLines - changedFile.numberOfDeletedLines
    const borderColorThreshold = 42
    if (diffCount > borderColorThreshold) {
        return ADDITION_COLOR
    } else if (diffCount < -borderColorThreshold) {
        return DELETION_COLOR
    }
    return 'yellow'
}

async function removeCurrentHighlighting(box: Box): Promise<void> {
    await renderManager.addStyleTo(borderId(box), {
        borderColor: null,
        borderWidth: null
    })
    await renderManager.remove(`${borderId(box)}Content`)
}

function borderId(box: Box): string {
    return `${box.getId()}Border`;
}