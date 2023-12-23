import { GitClient, Commit } from './GitClient'

test('getMostRecentCommit', async () => {
    const gitClient = new GitClient();
    const mostRecentCommit: Commit = await gitClient.getMostRecentCommit();
    expect(mostRecentCommit).not.toBeNull()
})