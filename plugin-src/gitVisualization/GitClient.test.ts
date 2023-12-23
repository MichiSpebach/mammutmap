import { Commit, GitClient } from './GitClient';

test('getMostRecentCommit', async () => {
    const gitClient = new GitClient('./');
    const mostRecentCommit: Commit = await gitClient.getMostRecentCommit();
    expect(mostRecentCommit.changedFilePaths.length).toBeGreaterThan(0)
})