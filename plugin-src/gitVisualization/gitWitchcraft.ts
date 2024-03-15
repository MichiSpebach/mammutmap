import {Box, getMapOrError, getRootFolder, Map, RootFolderBox} from '../../dist/pluginFacade'
import {ChangedFile, Commit} from './GitClient'
import {highlightBoxes} from './boxHighlighting'
import {existsSync} from 'fs'

export async function visualizeChanges(commits: Commit[], uncommittedChanges: ChangedFile[], isZoomingEnabled: boolean): Promise<void> {
    const changedFiles: ChangedFile[] = commits.flatMap(commit => commit.changedFiles)
    changedFiles.push(...uncommittedChanges)
    await visualizeChangedFiles(changedFiles, isZoomingEnabled)
}

export async function visualizeChangedFiles(changedFiles: ChangedFile[], isZoomingEnabled: boolean) {
    await highlightBoxes(changedFiles)
    if (isZoomingEnabled && changedFiles.length > 0) {
        await zoomToChanges(changedFiles.map(file => file.absolutePath))
    }
}

async function zoomToChanges(absoluteFilePaths: string[]): Promise<void> {
    const rootFolder: RootFolderBox = getRootFolder()
    const renderedBoxes: Box[] = absoluteFilePaths.map(path => {
        if (existsSync(path)) {
            return rootFolder.getRenderedBoxesInPath(path).at(-1)
        }
    }).filter(box => box) as Box[]
    const map: Map = getMapOrError()
    await map.zoomToFitBoxes(renderedBoxes)
}