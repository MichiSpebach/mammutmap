import {Box, getRootFolder, renderManager} from '../../dist/pluginFacade'
import {isSubPathOrEqual} from './pathUtil'
import {ChangedFile} from './GitClient'

let isInitialized: boolean = false
let currentFiles: ChangedFile[] = []
let lastFiles: ChangedFile[] = []
let forceRestyle: boolean = false

const ADDITION_COLOR = 'darkgreen'
const DELETION_COLOR = 'darkred'

function getFileForBox(box: Box, files: ChangedFile[]): ChangedFile | undefined {
    return files.find(file => isSubPathOrEqual(file.absolutePath, box.getSrcPath()))
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
            await removeCurrentHighlighting(this, lastFile)
        }
        const currentFile: ChangedFile | undefined = getFileForBox(this, currentFiles)
        if (currentFile !== undefined && (!isRendered || forceRestyle)) {
            if (this.isFolder()) {
                let numberOfAddedLines: number = 0
                let numberOfDeletedLines: number = 0
                const children: ChangedFile[] = currentFiles.filter(file =>
                    isSubPathOrEqual(file.absolutePath, this.getSrcPath()))
                for (const child of children) {
                    numberOfAddedLines += child.numberOfAddedLines
                    numberOfDeletedLines += child.numberOfDeletedLines
                }
                await highlightBox(this, {
                    absolutePath: this.getSrcPath(),
                    numberOfAddedLines: numberOfAddedLines,
                    numberOfDeletedLines: numberOfDeletedLines
                })
            } else {
                await highlightBox(this, currentFile)
            }
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
    await renderManager.addStyleTo(borderId(box), {
        borderColor: borderColor,
        borderWidth: '4.2px'
    })
    await renderManager.addElementTo(borderId(box), {
        id: `${borderId(box)}Content`,
        type: 'div',
        children: [{
            type: 'span',
            innerHTML: `<strong>${changedFile.numberOfAddedLines}+</strong> `,
            style: {color: ADDITION_COLOR}
        }, {
            type: 'span',
            innerHTML: `<strong>${changedFile.numberOfDeletedLines}-</strong> `,
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

async function removeCurrentHighlighting(box: Box, changedFile: ChangedFile): Promise<void> {
    await renderManager.addStyleTo(borderId(box), {
        borderColor: null,
        borderWidth: null
    })
    await renderManager.remove(`${borderId(box)}Content`)
}

function borderId(box: Box): string {
    return `${box.getId()}Border`;
}