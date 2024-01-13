import { RenderElementWithId, UltimateWidget } from '../../dist/core/Widget'
import { Map, Message, RenderElement, RenderElements, ToolbarView, getMap, onMapLoaded, renderManager } from '../../dist/pluginFacade'
import { Commit, GitClient } from './GitClient'
import { visualizeChanges, visualizeChangesByCommits } from './gitWitchcraft'

export class GitVisualizationToolbarView extends UltimateWidget implements ToolbarView {

    private isZoomingEnabled: boolean = true
    private selectedCommits: Commit[] = []

    public constructor(
        public readonly id: string
    ) {
        super()
        onMapLoaded.subscribe(async () => {
            this.selectedCommits = []
            await this.render()
        })
    }

    public getName(): string {
        return 'GitVisualization'
    }

    public getWidget(): UltimateWidget {
        return this
    }

    /**@deprecated simply use id field as it is readonly */
    public override getId(): string {
        return this.id
    }

    public override shape(): { element: RenderElementWithId; rendering?: Promise<void> | undefined } {
        setTimeout(() => this.render(), 42)
        return {
            element: {
                type: 'div',
                id: this.id
            }
        }
    }

    private async shapeInner(): Promise<RenderElements> {
        const map: Map | Message = getMap()
        if (map instanceof Message) {
            return map.message
        }
        return [
            this.shapeInputField('git-ref-input-from', 'HEAD^', 'Ref from: '),
            this.shapeInputField('git-ref-input-to', 'HEAD', 'Ref to: '),
            this.shapeButton(),
            this.shapeZoomToggle(),
            await this.shapeCommits(map)
        ]
    }

    private async shapeCommits(map: Map): Promise<RenderElement> {
        let numberOfCommits: number = 10
        const rootFolderPath: string = map.getRootFolder().getSrcPath()
        const gitClient = new GitClient(rootFolderPath)
        const commits: Commit[] = await gitClient.getCommits(`HEAD~${numberOfCommits}`, 'HEAD')
        const toggles: RenderElement[] = this.commitsToToggles(commits)
        const moreCommitsButton: RenderElement = {
            type: 'button',
            innerHTML: 'More Commits &#10133;',
            onclick: async () => {
                const moreCommits: Commit[] = await gitClient.getCommits(`HEAD~${numberOfCommits + 10}`, `HEAD~${numberOfCommits}`)
                numberOfCommits += 10
                renderManager.addElementsTo('commit-list', this.commitsToToggles(moreCommits))
            }
        }
        return {
            type: 'div',
            children: [{
                type: 'table',
                id: 'commit-list',
                children: toggles
            }, moreCommitsButton]
        }
    }

    private commitsToToggles(commits: Commit[]): RenderElement[] {
        return commits.map(commit => {
            return {
                type: 'tr',
                id: commit.hash,
                children: [
                    {
                        type: 'td',
                        style: { display: 'inline' },
                        innerHTML: '<input type="checkbox">',
                        onchangeChecked: (value: boolean) => {
                            if (value === true) {
                                this.selectedCommits.push(commit)
                            } else {
                                this.selectedCommits =
                                    this.selectedCommits.filter(selectedCommit =>
                                        selectedCommit !== commit)
                            }
                            this.selectedCommits.sort(GitClient.compareCommitsByDate)
                            visualizeChangesByCommits(this.selectedCommits, this.isZoomingEnabled)
                        }
                    },
                    {
                        type: 'td',
                        innerHTML: commit.message
                    }
                ]
            }
        })
    }

    private shapeButton(): RenderElement {
        return {
            type: 'button',
            innerHTML: 'View Changes between Refs &#129668;',
            onclick: async () => {
                const fromRef: string = await renderManager.getValueOf('git-ref-input-from')
                const toRef: string = await renderManager.getValueOf('git-ref-input-to')
                visualizeChanges(fromRef, toRef, this.isZoomingEnabled)
            }
        }
    }

    private shapeInputField(id: string, value: string, label: string): RenderElement {
        return {
            type: 'div',
            style: { display: 'block' },
            children: [
                {
                    type: 'span',
                    innerHTML: label
                },
                {
                    type: 'input',
                    value: value,
                    id: id
                }
            ]
        }
    }

    private shapeZoomToggle(): RenderElement {
        const checkedOrNot: string = this.isZoomingEnabled ? ' checked' : ''
        const checkbox: string = '<input type="checkbox" ' + checkedOrNot + '>'
        return {
            type: 'div',
            style: { display: 'block' },
            children: [
                {
                    type: 'span',
                    innerHTML: 'Zoom to changes?'
                },
                {
                    type: 'div',
                    style: { display: 'inline' },
                    innerHTML: checkbox,
                    onchangeChecked: (value: boolean) => {
                        this.isZoomingEnabled = value
                    }
                }
            ]
        }
    }

    public override async render(): Promise<void> {
        await renderManager.setElementsTo(this.id, await this.shapeInner())
    }

    public override async unrender(): Promise<void> {
        await renderManager.clearContentOf(this.id)
    }
}