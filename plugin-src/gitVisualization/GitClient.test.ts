import {ChangedFile, Commit, GitClient} from './GitClient'
import {DiffResult, Response} from "simple-git";

test('getMostRecentCommit', async () => {
    const gitClient = await GitClient.new('./') as GitClient
    const mostRecentCommit: Commit = await gitClient.getMostRecentCommit()
    expect(mostRecentCommit.changedFiles.length).toBeGreaterThan(0)
})

test('getCommits', async () => {
    const gitClient = await GitClient.new('./') as GitClient
    const commits: Commit[] = await gitClient.getCommits('HEAD^^', 'HEAD')
    expect(commits.length).toBe(2)
})

test('getChangedFiles for one commit', async () => {
    const gitClient = await GitClient.new('./') as GitClient
    const refs: string[] = ['HEAD^', 'HEAD']
    const files: ChangedFile[] = await gitClient.getChangedFiles(refs)
    expect(files.length).toBeGreaterThan(0)

    const file: ChangedFile = files[0]
    expect(file.absolutePath).toBeTruthy()
    expect(file.numberOfAddedLines).toBeGreaterThanOrEqual(0)
    expect(file.numberOfDeletedLines).toBeGreaterThanOrEqual(0)
    expect(file.changes).toBeTruthy()
})

test('getChangedFiles for no commit', async () => {
    const gitClient = await GitClient.new('./') as GitClient
    const refs: string[] = ['HEAD', 'HEAD']
    const files: ChangedFile[] = await gitClient.getChangedFiles(refs)
    expect(files.length).toBe(0)
})

test('compareCommitsByDate', async () => {
    const commitOne: Commit = {date: '2024-01-02T18:20:07+01:00', hash: '42a', author_name: 'Satoshi', changedFiles: []}
    const commitTwo: Commit = {date: '2024-01-02T18:20:06+01:00', hash: '42b', author_name: 'Satoshi', changedFiles: []}
    expect(GitClient.compareCommitsByDate(commitOne, commitTwo)).toBe(-1)
    expect(GitClient.compareCommitsByDate(commitTwo, commitOne)).toBe(1)
    expect(GitClient.compareCommitsByDate(commitOne, commitOne)).toBe(0)
})

test('parseChangesForFile', async () => {
    const diffOfFirstFile = 'diff --git a/src/pluginFacade.ts b/src/pluginFacade.ts\n' +
        'index 5b3b7b1..e2e4b9a 100644\n' +
        '--- a/src/pluginFacade.ts\n' +
        '+++ b/src/pluginFacade.ts\n' +
        '@@ -1,4 +1,4 @@\n' +
        ' }\n' +
        ' \n' +
        '-export async function addLink(fromBox: FileBox, toFilePath: string, options?: {\n' +
        '+export async function addLink(fromBox: FileBox, toFilePath: string, options?: {\n' +
        '   onlyReturnWarnings?: boolean\n' +
        '   delayUnwatchingOfBoxesInMS?: number\n' +
        ' }): Promise<{\n'
    const diffOfSecondFile = 'diff --git a/plugin-src/gitVisualization/GitClient.test.ts b/plugin-src/gitVisualization/GitClient.test.ts\n' +
        'index 042f205..b6b7086 100644\n'
    const changes: string = GitClient.parseChangesForFile('src/pluginFacade.ts',
        diffOfFirstFile + diffOfSecondFile)
    expect(changes).toEqual(diffOfFirstFile)
})

test('getDiffForFile', async () => {
    const gitClient = await GitClient.new('./') as GitClient
    const refs: string[] = ['HEAD', 'HEAD^']
    const files: ChangedFile[] = await gitClient.getChangedFiles(refs)
    const filePath: string = files[0].absolutePath
    const diff: string = await gitClient.getDiffForFile(filePath, refs)

    expect(diff).toBeTruthy()
    expect(diff).toContain('diff --git')
})