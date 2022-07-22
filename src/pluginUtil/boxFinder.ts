import { BoxWatcher } from '../box/BoxWatcher'
import { Box } from '../box/Box'
import { RootFolderBox } from '../box/RootFolderBox'
import { map } from '../Map'
import { util } from '../util'
import { FolderBox } from '../box/FolderBox'
import { FileBox } from '../box/FileBox'

export async function findBox(path: string, boxThatIncludesPath: FileBox): Promise<BoxWatcher|undefined> {
    const rootFolder: RootFolderBox|undefined = getRootFolder()
    if (!rootFolder) {
        return undefined
    }

    if (looksLikeRelativePath(path)) {
        const box: BoxWatcher|undefined = await findBoxForRelativePath(path, boxThatIncludesPath, rootFolder)
        if (box) {
            return box
        }
    }

    if (looksLikeAbsolutePath(path)) {
        const box: BoxWatcher|undefined = await findBoxForAbsolutePath(path, rootFolder)
        if (box) {
            return box
        }
    }

    const box: BoxWatcher|undefined = await findBoxForPathThatStartsInTheMiddle(path, boxThatIncludesPath, rootFolder)
    if (box) {
        return box
    }

    if (!looksLikeRelativePath(path)) {
        const box: BoxWatcher|undefined = await findBoxForRelativePath(path, boxThatIncludesPath, rootFolder)
        if (box) {
            return box
        }
    }

    if (!looksLikeAbsolutePath(path)) {
        const box: BoxWatcher|undefined = await findBoxForAbsolutePath(path, rootFolder)
        if (box) {
            return box
        }
    }
}

function getRootFolder(): RootFolderBox|undefined {
    if (!map) {
        util.logWarning('a folder has to be openend before calling boxFinder.findBox(..)')
        return undefined
    }
    return map.getRootFolder()
}

async function findBoxForRelativePath(path: string, boxThatIncludesPath: FileBox, rootFolder: RootFolderBox): Promise<BoxWatcher|undefined> {
    const absolutePath: string = util.concatPaths(boxThatIncludesPath.getParent().getSrcPath(), path)
    let box: BoxWatcher|undefined = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(absolutePath)
    if (!box) {
        box = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(absolutePath, {ignoreFileEndings: true})
    }
    return box
}

async function findBoxForAbsolutePath(path: string, rootFolder: RootFolderBox): Promise<BoxWatcher|undefined> {
    let box: BoxWatcher|undefined = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(path)
    if (!box) {
        box = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(path, {ignoreFileEndings: true})
    }
    return box
}

function looksLikeRelativePath(path: string): boolean {
    return path.startsWith('./') || path.startsWith('../')
}

function looksLikeAbsolutePath(path: string): boolean {
    return path.includes(':') || path.includes('//') || path.startsWith('/')
}

async function findBoxForPathThatStartsInTheMiddle(path: string, boxThatIncludesPath: FileBox, rootFolder: RootFolderBox): Promise<BoxWatcher|undefined> {
    for (let base: FolderBox = boxThatIncludesPath.getParent();!base.isRoot(); base = base.getParent()) {
        let box: BoxWatcher|undefined = await base.getBoxBySourcePathAndRenderIfNecessary(path)
        if (!box) {
            box = await base.getBoxBySourcePathAndRenderIfNecessary(path, {ignoreFileEndings: true})
        }
        if (box) {
            return box
        }
    }

    return undefined
}
