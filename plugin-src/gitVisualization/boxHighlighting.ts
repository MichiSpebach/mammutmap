import { Box, getRootFolder, renderManager } from '../../dist/pluginFacade'
import { isSubPathOrEqual } from './pathUtil'

let isInitialized: boolean = false
let currentFilePaths: string[] = []
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
        if (forceRestyle) {
            await removeCurrentHighlighting(this)
        }
        if (shouldBoxBeHighlighted(this, isRendered)) {
            await highlightBox(this)
        }
    }
}

export async function highlightBoxes(filePaths: string[]): Promise<void> {
    currentFilePaths = filePaths
    initializeBoxHighlighting()
    forceRestyle = true
    await getRootFolder().render()
    forceRestyle = true
}

function shouldBoxBeHighlighted(box: Box, isRendered: boolean): boolean {
    return (!isRendered || forceRestyle) &&
        (currentFilePaths.find(path => isSubPathOrEqual(path, box.getSrcPath())) != undefined)
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