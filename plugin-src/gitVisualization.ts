import { MenuItemFile, RootFolderBox, TextInputPopup, applicationMenu, coreUtil, getRootFolder } from '../dist/pluginFacade'
import { Commit, GitClient } from './gitVisualization/GitClient'
import { highlightBoxes } from './gitVisualization/boxHighlighting'

applicationMenu.addMenuItemTo('gitVisualization.js',
	new MenuItemFile({
		label: 'visualize commit by hash',
		click: () => promptForGitHash()
	}))

applicationMenu.addMenuItemTo('gitVisualization.js',
	new MenuItemFile({
		label: 'visualize last commit',
		click: () => visualizeLastCommit()
	}))

async function promptForGitHash(): Promise<void> {
	const hash: string | undefined = await TextInputPopup.buildAndRenderAndAwaitResolve('Git Hash', 'HEAD')
	if (hash) {
		await visualizeCommitsByHash(hash)
	}
}

async function visualizeCommitsByHash(hash: string): Promise<void> {
	let forceRestyle: boolean = true

	const rootFolder: RootFolderBox = getRootFolder()
	const rootFolderPath: string = rootFolder.getSrcPath()

	const gitClient = new GitClient(rootFolderPath)
	const commit: Commit = (await gitClient.getCommits(`${hash}^`, hash))[0]

	coreUtil.logInfo(`Commit message: ${commit.message}`)
	coreUtil.logInfo(`Changed file paths in commit: ${commit.changedFilePaths}`)

	const absoluteFilePaths: string[] = commit.changedFilePaths.map(path =>
		coreUtil.concatPaths(rootFolderPath, path))

	await highlightBoxes(absoluteFilePaths, forceRestyle)
	await rootFolder.render()
	forceRestyle = false
}

async function visualizeLastCommit(): Promise<void> {
	visualizeCommitsByHash('HEAD')
}