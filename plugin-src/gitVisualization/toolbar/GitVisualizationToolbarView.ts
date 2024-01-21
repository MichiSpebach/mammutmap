import { UltimateWidget } from '../../../dist/core/Widget'
import { Map, Message, ToolbarView, getMap, onMapRendered } from '../../../dist/pluginFacade'
import { GitClient } from '../GitClient'
import { GitRepositoryNotFoundWidget } from './GitRepositoryNotFoundWidget'
import { GitRepositoryWidget } from './GitRepositoryWidget'

export class GitVisualizationToolbarView implements ToolbarView {

    private gitClient: GitClient | Message = new Message('GitClient not initialized.')

    public constructor(
        public readonly id: string
    ) {
        onMapRendered.subscribe(async (map) => {
            const rootFolderPath: string = map.getRootFolder().getSrcPath()
            this.gitClient = await GitClient.new(rootFolderPath)
            await this.getWidget().render()
        })
    }

    public getName(): string {
        return 'GitVisualization'
    }

    public getWidget(): UltimateWidget {
        const map: Map | Message = getMap()
        if (map instanceof Message) {
            return new GitRepositoryNotFoundWidget(this.id, map.message)
        }
        if (this.gitClient instanceof Message) {
            return new GitRepositoryNotFoundWidget(this.id, this.gitClient.message)
        }
        return new GitRepositoryWidget(this.id, this.gitClient)
    }
}