import { MenuItemFile, RootFolderBox, applicationMenu, coreUtil, getRootFolder } from '../dist/pluginFacade';
import { Commit, GitClient } from './gitVisualization/GitClient';
import { highlightBoxes } from './gitVisualization/boxHighlighting';

applicationMenu.addMenuItemTo('gitVisualization.js',
	new MenuItemFile({
		label: 'visualize last commit',
		click: () => visualizeLastCommit()
	}))

let forceRestyle: boolean = true;

async function visualizeLastCommit(): Promise<void> {
	const rootFolder: RootFolderBox = getRootFolder()
	const rootFolderPath: string = rootFolder.getSrcPath()
	const gitClient = new GitClient(rootFolderPath)
	const mostRecentCommit: Commit = await gitClient.getMostRecentCommit()

	coreUtil.logInfo(`Last commit message: ${mostRecentCommit.message}`)
	coreUtil.logInfo(`Changed file paths in last commit message: ${mostRecentCommit.changedFilePaths}`)

	const absoluteFilePaths: string[] = mostRecentCommit.changedFilePaths.map(path =>
		coreUtil.concatPaths(rootFolderPath, path))

	await highlightBoxes(absoluteFilePaths, forceRestyle)
	await rootFolder.render()
	forceRestyle = false
}