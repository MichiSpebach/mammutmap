import {Box, getRootFolder, renderManager} from '../../dist/pluginFacade'
import {isSubPathOrEqual} from './pathUtil'
import {ChangedFile} from './GitClient'

let isInitialized: boolean = false
let currentFiles: ChangedFile[] = []
let lastFiles: ChangedFile[] = []
let forceRestyle: boolean = false

function initializeBoxHighlighting(): void {
    if (isInitialized) {
        return
    }
    isInitialized = true
    const renderBackup = Box.prototype.render
    Box.prototype.render = async function () {
        const isRendered: boolean = this.isRendered() // store if rendered, because renderBackup.call sets it true
        await renderBackup.call(this)
        if (shouldBoxBeReset(this)) {
            await removeCurrentHighlighting(this)
        }
        if (shouldBoxBeHighlighted(this, isRendered)) {
            await highlightBox(this)
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

function shouldBoxBeHighlighted(box: Box, isRendered: boolean): boolean {
    return (!isRendered || forceRestyle) && isBoxPathInPaths(box, currentFiles)
}

function shouldBoxBeReset(box: Box): boolean {
    return forceRestyle && isBoxPathInPaths(box, lastFiles)
}

function isBoxPathInPaths(box: Box, files: ChangedFile[]): boolean {
    return files.map(file => file.absolutePath)
        .find(path => isSubPathOrEqual(path, box.getSrcPath())) != undefined
}

async function highlightBox(box: Box): Promise<void> {
    await renderManager.addStyleTo(`${box.getId()}Border`, {
        borderColor: 'yellow',
        borderWidth: '4.2px'
    })
    // renderManager.addElementTo(`${box.getId()}Border`, {
    //     type: 'div',
    //     children: '+-+-+-+-+-+-+-'.repeat(420),
    //     style: { color: 'green' }
    // })
}

async function removeCurrentHighlighting(box: Box): Promise<void> {
    await renderManager.addStyleTo(`${box.getId()}Border`, {
        borderColor: null,
        borderWidth: null
    })
}