import { UltimateWidget } from '../../../dist/core/Widget'
import { Map, Message, ToolbarView, getMap, onMapRendered } from '../../../dist/pluginFacade'
import { GitClient, GitClientMessage } from '../GitClient'
import { GitRepositoryNotFoundWidget } from './GitRepositoryNotFoundWidget'
import { GitRepositoryWidget } from './GitRepositoryWidget'

export class GitVisualizationToolbarView implements ToolbarView {

	private widget: UltimateWidget = new GitRepositoryNotFoundWidget(this.id, '')

	public constructor(
		public readonly id: string
	) {
		onMapRendered.subscribe(async (map) => {
			const rootFolderSrcPath: string = map.getRootFolder().getSrcPath()
			const gitClient: GitClient | GitClientMessage = await GitClient.new(rootFolderSrcPath)
			if (gitClient instanceof GitClientMessage) {
				this.widget = new GitRepositoryNotFoundWidget(this.id, gitClient.message)
			} else {
				this.widget = new GitRepositoryWidget(this.id, gitClient)
			}
			await this.getWidget().render()
		})
	}

	public getName(): string {
		return 'GitVisualization'
	}

	public getWidget(): UltimateWidget {
		const map: Map | Message = getMap()
		if (map instanceof Message) {
			this.widget = new GitRepositoryNotFoundWidget(this.id, map.message)
		}
		return this.widget
	}
}