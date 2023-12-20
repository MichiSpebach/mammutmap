import { coreUtil, MenuItemFile, applicationMenu } from '../dist/pluginFacade'
import { GitClient, Commit } from './gitVisualization/GitClient'

applicationMenu.addMenuItemTo('gitVisualization.js', new MenuItemFile({ label: 'visualize last commit', click: () => visualizeLastCommit() }))

async function visualizeLastCommit(): Promise<void> {

	const gitClient = new GitClient()
	const mostRecentCommit: Commit = await gitClient.getMostRecentCommit()

	coreUtil.logInfo("Last commit message: " + mostRecentCommit.message)
	coreUtil.logInfo("Changed file paths in last commit message: " + mostRecentCommit.changedFilePaths)
}