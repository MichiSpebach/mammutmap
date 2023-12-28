import { Commit, GitClient } from './GitClient';

test('getMostRecentCommit', async () => {
    const gitClient = new GitClient('./');
    const mostRecentCommit: Commit = await gitClient.getMostRecentCommit()
    expect(mostRecentCommit.changedFilePaths.length).toBeGreaterThan(0)
})

test('getCommits', async () => {
    const gitClient = new GitClient('./');
    const commits: Commit[] = await gitClient.getCommits('HEAD^^', 'HEAD')
    expect(commits.length).toBe(2)
})