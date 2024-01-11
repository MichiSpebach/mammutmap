import { ChangedFile, Commit, GitClient } from './GitClient';

test('getMostRecentCommit', async () => {
    const gitClient = new GitClient('./');
    const mostRecentCommit: Commit = await gitClient.getMostRecentCommit()
    expect(mostRecentCommit.changedFiles.length).toBeGreaterThan(0)
})

test('getCommits', async () => {
    const gitClient = new GitClient('./');
    const commits: Commit[] = await gitClient.getCommits('HEAD^^', 'HEAD')
    expect(commits.length).toBe(2)
})

test('getChangedFiles for one commit', async () => {
    const gitClient = new GitClient('./');
    const refs: string[] = ['HEAD^', 'HEAD']
    const files: ChangedFile[] = await gitClient.getChangedFiles(refs)
    expect(files.length).toBeGreaterThan(0)
})

test('getChangedFiles for no commit', async () => {
    const gitClient = new GitClient('./');
    const refs: string[] = ['HEAD', 'HEAD']
    const files: ChangedFile[] = await gitClient.getChangedFiles(refs)
    expect(files.length).toBe(0)
})