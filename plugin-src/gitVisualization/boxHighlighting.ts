import {Box, getRootFolder, renderManager} from '../../dist/pluginFacade'
import {isSubPathOrEqual} from './pathUtil'
import {ChangedFile} from './GitClient'

let isInitialized: boolean = false
let currentFiles: ChangedFile[] = []
let lastFiles: ChangedFile[] = []
let forceRestyle: boolean = false

const ADDITION_COLOR = 'lime'
const DELETION_COLOR = 'red'

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
    const borderGradient: string = createBorderGradient(changedFileOrFolder)
    await renderManager.addStyleTo(`${box.getId()}Border`, {
        borderWidth: '4.2px',
        borderImageSlice: '1',
        borderImageSource: borderGradient
    })
    await renderManager.addElementTo(`${box.header.getId()}Inner`, {
        id: `${box.header.getId()}InnerGitDiff`,
        type: 'div',
        children: [{
            type: 'span',
            innerHTML: `${changedFileOrFolder.numberOfAddedLines}+&nbsp;`,
            style: {color: ADDITION_COLOR}
        }, {
            type: 'span',
            innerHTML: `${changedFileOrFolder.numberOfDeletedLines}-&nbsp;`,
            style: {color: DELETION_COLOR}
        }],
        style: {float: 'right'}
    })
}

function createBorderGradient(changedFile: ChangedFile): string {
    const numberOfChanges: number = changedFile.numberOfAddedLines + changedFile.numberOfDeletedLines
    const percentageOfAdditions: number = changedFile.numberOfAddedLines / numberOfChanges * 100
    return `linear-gradient(45deg, ${ADDITION_COLOR}, ${percentageOfAdditions}%, ${DELETION_COLOR})`
}

async function removeCurrentHighlighting(box: Box): Promise<void> {
    await renderManager.addStyleTo(`${box.getId()}Border`, {
        borderImageSlice: '0',
        borderImageSource: 'none',
        borderWidth: null
    })
    await renderManager.remove(`${box.header.getId()}InnerGitDiff`)
}