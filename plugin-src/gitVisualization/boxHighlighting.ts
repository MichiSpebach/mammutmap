import { coreUtil, Box, renderManager, getRootFolder } from '../../dist/pluginFacade'
import { isSubPathOrEqual } from './pathUtil'

export async function highlightBoxes(filePaths: string[], forceRestyle: boolean): Promise<void> {
    const rootFolderPath: string = getRootFolder().getSrcPath()
    filePaths = filePaths.map(path => coreUtil.concatPaths(rootFolderPath, path))
    const renderBackup = Box.prototype.render
    Box.prototype.render = async function () {
        await renderBackup.call(this)
        if (shouldBoxBeHighlighted(this, filePaths, forceRestyle)) {
            highlightBox(this)
        }
    }
    await getRootFolder().render()
}

function shouldBoxBeHighlighted(box: Box, filePaths: string[], forceRestyle): boolean {
    const isRendered: boolean = box.isRendered()
    return (!isRendered || forceRestyle) &&
        (filePaths.find(path => isSubPathOrEqual(path, box.getSrcPath())) != undefined)
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