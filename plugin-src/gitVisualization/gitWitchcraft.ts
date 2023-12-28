import { RootFolderBox, getRootFolder, coreUtil } from '../../dist/pluginFacade'
import { GitClient, Commit } from './GitClient'
import { highlightBoxes } from './boxHighlighting'

export async function visualizeCommitsByRef(ref: string): Promise<void> {
    let forceRestyle: boolean = true

    const rootFolder: RootFolderBox = getRootFolder()
    const rootFolderPath: string = rootFolder.getSrcPath()

    const gitClient = new GitClient(rootFolderPath)
    const commit: Commit = (await gitClient.getCommits(`${ref}^`, ref))[0]

    coreUtil.logInfo(`Commit message: ${commit.message}`)
    coreUtil.logInfo(`Changed file paths in commit: ${commit.changedFilePaths}`)

    const absoluteFilePaths: string[] = commit.changedFilePaths.map(path => coreUtil.concatPaths(rootFolderPath, path))

    await highlightBoxes(absoluteFilePaths, forceRestyle)
    await rootFolder.render()
    forceRestyle = false
}

export async function visualizeLastCommit(): Promise<void> {
    visualizeCommitsByRef('HEAD')
}