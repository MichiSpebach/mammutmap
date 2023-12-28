import { DefaultLogFields, ListLogLine, LogResult, simpleGit, SimpleGit } from 'simple-git'

export type Commit = {
    changedFilePaths: string[]
    message?: string
}

export class GitClient {

    private readonly git: SimpleGit

    public constructor(baseDir: string) {
        this.git = simpleGit(baseDir)
    }

    public async getMostRecentCommit(): Promise<Commit> {
        return (await this.getCommits('HEAD^', 'HEAD'))[0]
    }

    public async getCommits(from: string, to: string): Promise<Commit[]> {
        let log: LogResult<DefaultLogFields>
        try {
            log = await this.git.log({ 'from': from, 'to': to })
        } catch (error) {
            log = await this.git.log({ 'from': 'HEAD^', 'to': 'HEAD' })
        }
        const logEntries: readonly (DefaultLogFields & ListLogLine)[] = log.all
        let commits: Commit[] = []
        for (let logEntry of logEntries) {
            commits.push({
                ...logEntry,
                changedFilePaths: await this.getChangedFilePaths(`${logEntry.hash}^`, logEntry.hash)
            })
        }
        return commits
    }

    public async getChangedFilePaths(from: string, to: string): Promise<string[]> {
        const diff: string = await this.git.diff(['--name-only', from, to])
        return diff.split('\n').filter(nonEmptyFilePath => nonEmptyFilePath)
    }
}