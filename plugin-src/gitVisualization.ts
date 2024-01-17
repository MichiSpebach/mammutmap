import { MenuItemFile, TextInputPopup, applicationMenu, mainWidget } from '../dist/pluginFacade'
import { GitVisualizationToolbarView } from './gitVisualization/GitVisualizationToolbarView'
import { visualizeCommitByRef, visualizeLastCommit } from './gitVisualization/gitWitchcraft'

const commitByRefMenuItem: MenuItemFile = new MenuItemFile({
	label: 'visualize commit by reference',
	click: promptForGitRef
})
const lastCommitMenuItem: MenuItemFile = new MenuItemFile({
	label: 'visualize last commit',
	click: visualizeLastCommit
})
applicationMenu.addMenuItemTo('gitVisualization.js', commitByRefMenuItem)
applicationMenu.addMenuItemTo('gitVisualization.js', lastCommitMenuItem)

async function promptForGitRef(): Promise<void> {
	const ref: string | undefined = await TextInputPopup.buildAndRenderAndAwaitResolve('Git Ref', 'HEAD')
	if (ref) {
		await visualizeCommitByRef(ref)
	}
}

mainWidget.sidebar.addView(new GitVisualizationToolbarView('GitVisualization'))