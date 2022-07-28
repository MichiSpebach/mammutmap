import { BoxWatcher } from '../box/BoxWatcher'
import { Box } from '../box/Box'
import { RootFolderBox } from '../box/RootFolderBox'
import { map } from '../Map'
import { util } from '../util'
import { FolderBox } from '../box/FolderBox'
import { FileBox } from '../box/FileBox'

export async function findBox(
    path: string, boxThatIncludesPath: FileBox, options?: {onlyReturnWarnings?: boolean}
): Promise<{boxWatcher?: BoxWatcher, warnings?: string[]}> {
    const rootFolder: RootFolderBox|undefined = getRootFolder()
    if (!rootFolder) {
        return {}
    }

    let warnings: string[]|undefined = undefined

    if (looksLikeRelativePath(path)) {
        const report = await findBoxForRelativePath(path, boxThatIncludesPath, rootFolder, options)
        warnings = concatWarnings(warnings, report.warnings)
        if (report.boxWatcher) {
            return {boxWatcher: report.boxWatcher, warnings}
        }
    }

    if (looksLikeAbsolutePath(path)) {
        const report = await findBoxForAbsolutePath(path, rootFolder, options)
        warnings = concatWarnings(warnings, report.warnings)
        if (report.boxWatcher) {
            return {boxWatcher: report.boxWatcher, warnings}
        }
    }

    const report = await findBoxForPathThatStartsInTheMiddle(path, boxThatIncludesPath, rootFolder, options)
    warnings = concatWarnings(warnings, report.warnings)
    if (report.boxWatcher) {
        return {boxWatcher: report.boxWatcher, warnings}
    }

    if (!looksLikeRelativePath(path)) {
        const report = await findBoxForRelativePath(path, boxThatIncludesPath, rootFolder, options)
        warnings = concatWarnings(warnings, report.warnings)
        if (report.boxWatcher) {
            return {boxWatcher: report.boxWatcher, warnings}
        }
    }

    if (!looksLikeAbsolutePath(path)) {
        const report = await findBoxForAbsolutePath(path, rootFolder, options)
        warnings = concatWarnings(warnings, report.warnings)
        if (report.boxWatcher) {
            return {boxWatcher: report.boxWatcher, warnings}
        }
    }

    return {warnings}
}

function getRootFolder(): RootFolderBox|undefined {
    if (!map) {
        util.logWarning('a folder has to be openend before calling boxFinder.findBox(..)')
        return undefined
    }
    return map.getRootFolder()
}

async function findBoxForRelativePath(
    path: string, 
    boxThatIncludesPath: FileBox, 
    rootFolder: RootFolderBox, 
    options?: {onlyReturnWarnings?: boolean}
): Promise<{boxWatcher?: BoxWatcher, warnings?: string[]}> {
    const absolutePath: string = util.concatPaths(boxThatIncludesPath.getParent().getSrcPath(), path)
    let report = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(absolutePath, options)
    let warnings: string[]|undefined = report.warnings
    if (!report.boxWatcher) {
        report = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(absolutePath, {ignoreFileEndings: true, onlyReturnWarnings: options?.onlyReturnWarnings})
        warnings = concatWarnings(warnings, report.warnings)
    }
    return {boxWatcher: report.boxWatcher, warnings}
}

async function findBoxForAbsolutePath(
    path: string, 
    rootFolder: RootFolderBox,
    options?: {onlyReturnWarnings?: boolean}
): Promise<{boxWatcher?: BoxWatcher, warnings?: string[]}> {
    let report = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(path, options)
    let warnings: string[]|undefined = report.warnings
    if (!report.boxWatcher) {
        report = await rootFolder.getBoxBySourcePathAndRenderIfNecessary(path, {ignoreFileEndings: true, onlyReturnWarnings: options?.onlyReturnWarnings})
        warnings = concatWarnings(warnings, report.warnings)
    }
    return {boxWatcher: report.boxWatcher, warnings}
}

function looksLikeRelativePath(path: string): boolean {
    return path.startsWith('./') || path.startsWith('../')
}

function looksLikeAbsolutePath(path: string): boolean {
    return path.includes(':') || path.includes('//') || path.startsWith('/')
}

async function findBoxForPathThatStartsInTheMiddle(
    path: string, 
    boxThatIncludesPath: FileBox, 
    rootFolder: RootFolderBox,
    options?: {onlyReturnWarnings?: boolean}
): Promise<{boxWatcher?: BoxWatcher, warnings?: string[]}> {
    let warnings: string[]|undefined = undefined

    for (let base: FolderBox = boxThatIncludesPath.getParent();!base.isRoot(); base = base.getParent()) {
        let report = await base.getBoxBySourcePathAndRenderIfNecessary(path, options)
        warnings = concatWarnings(warnings, report.warnings)
        if (!report.boxWatcher) {
            report = await base.getBoxBySourcePathAndRenderIfNecessary(path, {ignoreFileEndings: true, ...options})
            warnings = concatWarnings(warnings, report.warnings)
        }
        if (report.boxWatcher) {
            return {boxWatcher: report.boxWatcher, warnings}
        }
    }

    return {warnings}
}

function concatWarnings(warnings: string[]|undefined, otherWarnings: string[]|undefined): string[]|undefined {
    if (!otherWarnings) {
        return warnings
    }
    return warnings?.concat(otherWarnings)
}
