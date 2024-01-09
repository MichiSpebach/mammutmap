import { Box, Map, RootFolderBox, coreUtil, getMapOrError, getRootFolder } from '../../dist/pluginFacade'
import { ChangedFile, Commit, GitClient } from './GitClient'
import { highlightBoxes } from './boxHighlighting'

export async function visualizeChanges(from: string, to: string, isZoomingEnabled: boolean): Promise<void> {
    const rootFolder: RootFolderBox = getRootFolder()
    const rootFolderPath: string = rootFolder.getSrcPath()

    const gitClient = new GitClient(rootFolderPath)
    const changedFiles: ChangedFile[] = await gitClient.getChangedFiles(from, to)
    const commits: Commit[] = await gitClient.getCommits(from, to)

    coreUtil.logInfo(`Commit message(s): ${commits.map(commit => commit.message)}`)
    coreUtil.logInfo(`Changed file paths: ${changedFiles.map(file => file.path)}`)

    const absoluteFilePaths: string[] = changedFiles.map(file =>
        coreUtil.concatPaths(rootFolderPath, file.path))

    await highlightBoxes(absoluteFilePaths)
    if (isZoomingEnabled) {
        await zoomToChanges(absoluteFilePaths)
    }
}

async function zoomToChanges(absoluteFilePaths: string[]): Promise<void> {
    const rootFolder: RootFolderBox = getRootFolder()
    const changedFileBoxesRendered: Box[] = absoluteFilePaths.map(path =>
        rootFolder.getRenderedBoxesInPath(path).at(-1)).filter(box => box) as Box[]
    const map: Map = getMapOrError()
    map.zoomToFitBoxes(changedFileBoxesRendered)
}

export async function visualizeCommitByRef(ref: string): Promise<void> {
    visualizeChanges(`${ref}^`, ref, true)
}

export async function visualizeLastCommit(): Promise<void> {
    visualizeCommitByRef('HEAD')
}