import { Box, Map, RootFolderBox, coreUtil, getMapOrError, getRootFolder } from '../../dist/pluginFacade'
import { ChangedFile, Commit } from './GitClient'
import { highlightBoxes } from './boxHighlighting'

export async function visualizeChanges(commits: Commit[], uncommittedChanges: ChangedFile[], isZoomingEnabled: boolean): Promise<void> {
    const changedFiles: ChangedFile[] = commits.flatMap(commit => commit.changedFiles)
    changedFiles.push(...uncommittedChanges)

    coreUtil.logInfo(`Commit message(s): ${commits.map(commit => commit.message)}`)
    coreUtil.logInfo(`Changed file paths: ${changedFiles.map(file => file.path)}`)

    await visualizeChangedFiles(changedFiles, isZoomingEnabled)
}

export async function visualizeChangedFiles(changedFiles: ChangedFile[], isZoomingEnabled: boolean) {
    const absoluteFilePaths: string[] = changedFiles.map(file =>
        coreUtil.concatPaths(getRootFolder().getSrcPath(), file.path))
    await highlightBoxes(absoluteFilePaths)
    if (isZoomingEnabled && absoluteFilePaths.length > 0) {
        await zoomToChanges(absoluteFilePaths)
    }
}

async function zoomToChanges(absoluteFilePaths: string[]): Promise<void> {
    const rootFolder: RootFolderBox = getRootFolder()
    const renderedBoxes: Box[] = absoluteFilePaths.map(path =>
        rootFolder.getRenderedBoxesInPath(path).at(-1)).filter(box => box) as Box[]
    const map: Map = getMapOrError()
    await map.zoomToFitBoxes(renderedBoxes)
}