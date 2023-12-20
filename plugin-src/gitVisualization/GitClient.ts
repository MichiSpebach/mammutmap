import { DefaultLogFields, ListLogLine, LogResult, simpleGit, SimpleGit } from 'simple-git'

export type Commit = {
    changedFilePaths: string[]
    message?: string
}

export class GitClient {

    private readonly git: SimpleGit

    public constructor() {
        this.git = simpleGit('./')
    }

    public async getMostRecentCommit(): Promise<Commit> {
        const log: LogResult<DefaultLogFields> = await this.git.log()
        const logEntry: (DefaultLogFields & ListLogLine) | null = log.latest;
        const diff: string = await this.git.diff(['--name-only', 'HEAD^', 'HEAD'])
        return { ...logEntry, changedFilePaths: diff.split("\n").filter(nonEmptyFilePath => nonEmptyFilePath) }
    }
}