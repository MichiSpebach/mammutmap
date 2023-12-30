import { RootFolderBox, coreUtil, getRootFolder } from '../../dist/pluginFacade'
import { ChangedFile, Commit, GitClient } from './GitClient'
import { highlightBoxes } from './boxHighlighting'

export async function visualizeChanges(from: string, to: string): Promise<void> {
    let forceRestyle: boolean = true

    const rootFolder: RootFolderBox = getRootFolder()
    const rootFolderPath: string = rootFolder.getSrcPath()

    const gitClient = new GitClient(rootFolderPath)
    const changedFiles: ChangedFile[] = await gitClient.getChangedFiles(from, to)
    const commits: Commit[] = await gitClient.getCommits(from, to)

    coreUtil.logInfo(`Commit message(s): ${commits.map(commit => commit.message)}`)
    coreUtil.logInfo(`Changed file paths: ${changedFiles.map(file => file.path)}`)

    const absoluteFilePaths: string[] = changedFiles.map(file =>
        coreUtil.concatPaths(rootFolderPath, file.path))

    await highlightBoxes(absoluteFilePaths, forceRestyle)
    await rootFolder.render()
    forceRestyle = false
}

export async function visualizeCommitByRef(ref: string): Promise<void> {
    visualizeChanges(`${ref}^`, ref)
}

export async function visualizeLastCommit(): Promise<void> {
    visualizeCommitByRef('HEAD')
}