import {Box, getMapOrError, getRootFolder, Map, RootFolderBox} from '../../dist/pluginFacade'
import {ChangedFile, Commit} from './GitClient'
import {highlightBoxes} from './boxHighlighting'
import {existsSync} from 'fs'

export async function visualizeChanges(commits: Commit[], uncommittedChanges: ChangedFile[], isZoomingEnabled: boolean): Promise<void> {
    const changedFiles: ChangedFile[] = commits.flatMap(commit => commit.changedFiles)
    changedFiles.push(...uncommittedChanges)
    const changedFilesJoined: ChangedFile[] = join(changedFiles)
    await visualizeChangedFiles(changedFilesJoined, isZoomingEnabled)
}

function join(changedFiles: ChangedFile[]): ChangedFile[] {
    const changedFilesJoined: ChangedFile[] = []
    changedFiles.forEach(changedFile => {
        const existingFile = changedFilesJoined.find(file =>
            file.absolutePath === changedFile.absolutePath)
        if (existingFile) {
            existingFile.numberOfAddedLines += changedFile.numberOfAddedLines
            existingFile.numberOfDeletedLines += changedFile.numberOfDeletedLines
        } else {
            changedFilesJoined.push({...changedFile})
        }
    })
    return changedFilesJoined
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