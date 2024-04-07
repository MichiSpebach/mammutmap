import { Box, ChildProcess, environment, fileSystem, getMapOrError, getRootFolder, Map, RootFolderBox } from '../../dist/pluginFacade'
import { ChangedFile, Commit } from './GitClient'
import { highlightBoxes } from './boxHighlighting'

let selectedRefs: string[] = []

export async function visualizeChanges(commits: Commit[], uncommittedChanges: ChangedFile[], isZoomingEnabled: boolean): Promise<void> {
	selectedRefs = commits.map(commit => commit.hash.substring(0, 8))
	if (uncommittedChanges.length > 0) {
		selectedRefs = ['HEAD', ...selectedRefs]
	}
	const changedFiles: ChangedFile[] = commits.flatMap(commit => commit.changedFiles)
	changedFiles.push(...uncommittedChanges)
	const changedFilesJoined: ChangedFile[] = join(changedFiles)
	await visualizeChangedFiles(changedFilesJoined, isZoomingEnabled)
}

function join(changedFiles: ChangedFile[]): ChangedFile[] {
	const changedFilesJoined: ChangedFile[] = []
	changedFiles.forEach(changedFile => {
		const existingFile = changedFilesJoined.find(file =>
			file.absolutePath === changedFile.absolutePath)
		if (existingFile) {
			existingFile.numberOfAddedLines += changedFile.numberOfAddedLines
			existingFile.numberOfDeletedLines += changedFile.numberOfDeletedLines
		} else {
			changedFilesJoined.push({...changedFile})
		}
	})
	return changedFilesJoined
}

export async function visualizeChangedFiles(changedFiles: ChangedFile[], isZoomingEnabled: boolean) {
	await highlightBoxes(changedFiles)
	if (isZoomingEnabled && changedFiles.length > 0) {
		await zoomToChanges(changedFiles.map(file => file.absolutePath))
	}
}

async function zoomToChanges(absoluteFilePaths: string[]): Promise<void> {
	const rootFolder: RootFolderBox = getRootFolder()
	// TODO: Implement doesFileExist in fileSystem
	const pathsOfExistingFiles = absoluteFilePaths.filter(async path =>
		await fileSystem.doesDirentExistAndIsFile(path))
	console.log(pathsOfExistingFiles)
	const renderedBoxes: Box[] = pathsOfExistingFiles.map(path => {
		return rootFolder.getRenderedBoxesInPath(path).at(-1)
	}).filter(box => box) as Box[]
	const map: Map = getMapOrError()
	await map.zoomToFitBoxes(renderedBoxes)
}

export async function openChanges(changedFile: ChangedFile): Promise<void> {
	let refsForGitDiffTool: string = selectedRefs.at(0)!
	if (selectedRefs.length > 1) {
		refsForGitDiffTool = `"${refsForGitDiffTool}" "${selectedRefs.at(-1)}^"`
	} else if (refsForGitDiffTool !== 'HEAD') {
		refsForGitDiffTool = `"${refsForGitDiffTool}" "${refsForGitDiffTool}^"`
	}

	const currentWorkingDirectory: string = getRootFolder().getSrcPath()

	// race condition between storing config and running gitDiffCommand might occur
	configureGitDifftoolIfNotSet(currentWorkingDirectory)

	const gitDiffCommand: string = `git difftool --no-prompt ${refsForGitDiffTool} -- ${changedFile.absolutePath}`
	environment.runShellCommand(gitDiffCommand, {currentWorkingDirectory})
}

function configureGitDifftoolIfNotSet(currentWorkingDirectory: string) {
	const process: ChildProcess = environment.runShellCommand(
		`git config --includes diff.tool`, {currentWorkingDirectory})
	process.on('exit', (code: number) => {
		if (code !== 0) {
			console.log('Setting up VSCode as default difftool for git. You can change the difftool in .git/config.')
			environment.runShellCommand(`git config --global diff.tool default-difftool & ` +
				`git config --global difftool.default-difftool.cmd "code --wait --diff $LOCAL $REMOTE"`,
				{currentWorkingDirectory})
		}
	})
}