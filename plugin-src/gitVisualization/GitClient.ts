import {DefaultLogFields, ListLogLine, LogResult, simpleGit, SimpleGit} from 'simple-git'
import {util as coreUtil} from '../../dist/core/util/util'

//import {Message} from '../../dist/pluginFacade'

export class Message {
    public constructor(
        public message: string
    ) {
    }
}


export type Commit = {
    changedFiles: ChangedFile[]
    message?: string
    hash: string
    author_name: string
    date: string
}

export type ChangedFile = {
    absolutePath: string
    numberOfAddedLines: number
    numberOfDeletedLines: number
    changes?: string
}

export class GitClient {

    private readonly git: SimpleGit
    private readonly rootFolderSrcPath: string

    public static async new(rootFolderSrcPath: string): Promise<GitClient | Message> {
        const gitClient = new GitClient(rootFolderSrcPath)
        try {
            await gitClient.git.log()
        } catch (error) {
            return new Message('No git commits found.')
        }
        return gitClient
    }

    private constructor(rootFolderSrcPath: string) {
        this.rootFolderSrcPath = rootFolderSrcPath
        this.git = simpleGit(rootFolderSrcPath)
    }

    public async getMostRecentCommit(): Promise<Commit> {
        return (await this.getCommits('HEAD^', 'HEAD'))[0]
    }

    public async getCommits(from: string, to: string): Promise<Commit[]> {
        let log: LogResult<DefaultLogFields>
        try {
            log = await this.git.log({'from': from, 'to': to})
        } catch (error) {
            log = await this.git.log({'from': 'HEAD^', 'to': 'HEAD'})
        }
        const logEntries: readonly (DefaultLogFields & ListLogLine)[] = log.all
        const commits: Commit[] = []
        for (const logEntry of logEntries) {
            const refs: string[] = [`${logEntry.hash}^`, logEntry.hash]
            commits.push({
                ...logEntry,
                changedFiles: await this.getChangedFiles(refs)
            })
        }
        return commits
    }

    public async getChangedFiles(refs: string[]): Promise<ChangedFile[]> {
        if (refs.length === 0) {
            return []
        }
        const diffSummary: string = await this.git.diff(['--numstat', ...refs])
        //const diffDetails: string = await this.git.diff([...refs])
        const changedFiles: ChangedFile[] = []
        diffSummary.split('\n')
            .filter(nonEmptyLine => nonEmptyLine)
            .map(async line => {
                const diffForFile: string[] = line.split('\t')
                const relativePath: string = diffForFile[2]
                const absolutePath: string = coreUtil.concatPaths(this.rootFolderSrcPath, relativePath)
                //const changes: string = GitClient.parseChangesForFile(relativePath, diffDetails)
                const changes: string = await this.getDiffForFile(relativePath, refs)
                changedFiles.push({
                    absolutePath: absolutePath,
                    numberOfAddedLines: parseInt(diffForFile[0]),
                    numberOfDeletedLines: parseInt(diffForFile[1]),
                    changes: changes
                })
            })
        return changedFiles
    }

    public static parseChangesForFile(filePath: string, diff: string): string {
        const diffLines: string[] = diff.split('\n')
        const startLine: number = diffLines
            .findIndex(line => line.endsWith(filePath))
        const numberOfLines: number = diffLines.slice(startLine + 1)
            .findIndex(line => line.startsWith('diff --git')) + 1
        const changes: string = diffLines.slice(startLine, startLine + numberOfLines)
            .join('\n') + '\n'
        return changes
    }

    public async getDiffForFile(filePath: string,
                                refs: string[]): Promise<string> {
        return this.git.diff([...refs, '--', filePath]);
    }

    public static compareCommitsByDate(commitOne: Commit, commitTwo: Commit) {
        if (commitOne.date < commitTwo.date) return 1
        if (commitOne.date > commitTwo.date) return -1
        return 0
    }
}