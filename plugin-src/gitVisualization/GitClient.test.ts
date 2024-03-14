import { ChangedFile, Commit, GitClient } from './GitClient';

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
    expect(file.path).toBeTruthy()
    expect(file.numberOfAddedLines).toBeGreaterThanOrEqual(0)
    expect(file.numberOfDeletedLines).toBeGreaterThanOrEqual(0)
})

test('getChangedFiles for no commit', async () => {
    const gitClient = await GitClient.new('./') as GitClient
    const refs: string[] = ['HEAD', 'HEAD']
    const files: ChangedFile[] = await gitClient.getChangedFiles(refs)
    expect(files.length).toBe(0)
})

test('compareCommitsByDate', async () => {
    const commitOne: Commit = { date: '2024-01-02T18:20:07+01:00', hash: '42a', author_name: 'Satoshi', changedFiles: [] }
    const commitTwo: Commit = { date: '2024-01-02T18:20:06+01:00', hash: '42b', author_name: 'Satoshi', changedFiles: [] }
    expect(GitClient.compareCommitsByDate(commitOne, commitTwo)).toBe(-1)
    expect(GitClient.compareCommitsByDate(commitTwo, commitOne)).toBe(1)
    expect(GitClient.compareCommitsByDate(commitOne, commitOne)).toBe(0)
})