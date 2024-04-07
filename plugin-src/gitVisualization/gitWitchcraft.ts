import {Box, environment, getMapOrError, getRootFolder, Map, RootFolderBox, fileSystem} from '../../dist/pluginFacade'
import {ChangedFile, Commit} from './GitClient'
import {highlightBoxes} from './boxHighlighting'

let selectedRefs: string[] = []

export async function visualizeChanges(commits: Commit[], uncommittedChanges: ChangedFile[], isZoomingEnabled: boolean): Promise<void> {
    selectedRefs = commits.map(commit => commit.hash)
    if (uncommittedChanges.length > 0) {
        selectedRefs = ['HEAD', ...selectedRefs]
    }
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
    const pathsOfExistingFiles = absoluteFilePaths.filter(async path =>
        await fileSystem.doesDirentExist(path))
    const renderedBoxes: Box[] = pathsOfExistingFiles.map(path => {
        return rootFolder.getRenderedBoxesInPath(path).at(-1)
    }).filter(box => box) as Box[]
    const map: Map = getMapOrError()
    await map.zoomToFitBoxes(renderedBoxes)
}

export async function openChanges(changedFile: ChangedFile): Promise<void> {
    let refs: string = `${selectedRefs.at(0)!.substring(0, 8)}`
    if (selectedRefs.length > 1) {
        refs = `"${refs}" "${selectedRefs.at(-1)?.substring(0, 8)}^"`
    } else if (refs !== 'HEAD') {
        refs = `"${refs}" "${refs}^"`
    }

    const command: string = `git config diff.tool default-difftool & ` +
        `git config difftool.default-difftool.cmd "code --wait --diff $LOCAL $REMOTE" & ` +
        `git difftool --no-prompt ${refs} -- ${changedFile.absolutePath}`
    environment.runShellCommand(command, {cwd: getRootFolder().getSrcPath()})
}