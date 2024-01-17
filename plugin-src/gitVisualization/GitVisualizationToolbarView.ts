import { RenderElementWithId, UltimateWidget } from '../../dist/core/Widget'
import { Map, Message, RenderElement, RenderElements, ToolbarView, getMap, onMapLoaded, renderManager } from '../../dist/pluginFacade'
import { ChangedFile, Commit, GitClient } from './GitClient'
import { visualizeChanges } from './gitWitchcraft'

export class GitVisualizationToolbarView extends UltimateWidget implements ToolbarView {

    private isZoomingEnabled: boolean = true
    private selectedCommits: Commit[] = []
    private commits: Commit[] = []
    private refFrom: string = 'HEAD^'
    private refTo: string = 'HEAD'
    private isUncommittedChangesShown = false
    private uncommittedChanges: ChangedFile[] = []
    private gitClient: GitClient = new GitClient('.')

    public constructor(
        public readonly id: string
    ) {
        super()
        onMapLoaded.subscribe(async () => {
            this.selectedCommits = []
            this.commits = []
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
        const rootFolderPath: string = map.getRootFolder().getSrcPath()
        this.gitClient = new GitClient(rootFolderPath)
        return [
            {
                type: 'table',
                children: [
                    this.shapeInputField('git-ref-input-from', this.refFrom, 'Ref from: '),
                    this.shapeInputField('git-ref-input-to', this.refTo, 'Ref to: ')
                ]
            },
            this.shapeButton(),
            this.shapeZoomToggle(),
            await this.shapeCommitToggles()
        ]
    }

    private async shapeCommitToggles(): Promise<RenderElement> {
        this.uncommittedChanges = await this.gitClient.getChangedFiles(['HEAD'])
        const uncommittedChangesToggle: RenderElement = this.shapeUncommittedChangesToggle(this.uncommittedChanges)
        if (this.commits.length === 0) {
            this.commits = await this.gitClient.getCommits('HEAD~10', 'HEAD')
        }
        const toggles: RenderElement[] = [uncommittedChangesToggle, ...this.convertCommitsToToggles(this.commits)]
        const moreCommitsButton: RenderElement = {
            type: 'button',
            innerHTML: 'More Commits &#10133;',
            onclick: async () => {
                const numberOfCommits = this.commits.length
                this.commits.push(...await this.gitClient.getCommits(`HEAD~${numberOfCommits + 10}`, `HEAD~${numberOfCommits}`))
                this.render()
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

    private shapeUncommittedChangesToggle(uncommittedChanges: ChangedFile[]): RenderElement {
        const checkedOrNot: string = this.isUncommittedChangesShown ? 'checked' : ''
        const checkbox: string = '<input type="checkbox" ' + checkedOrNot + '>'
        return {
            type: 'tr',
            children: [
                {
                    type: 'td',
                    style: { display: 'inline' },
                    innerHTML: checkbox,
                    onchangeChecked: (value: boolean) => {
                        this.isUncommittedChangesShown = value
                        this.render()
                    }
                },
                {
                    type: 'td',
                    innerHTML: '&#129668; Uncommitted changes'
                }
            ]
        }
    }

    private convertCommitsToToggles(commits: Commit[]): RenderElement[] {
        return commits.map(commit => {
            const checkedOrNot: string = this.selectedCommits.find(selectedCommit =>
                selectedCommit.hash === commit.hash) !== undefined ? ' checked' : ''
            const checkbox: string = '<input type="checkbox" ' + checkedOrNot + '>'
            return {
                type: 'tr',
                id: commit.hash,
                children: [
                    {
                        type: 'td',
                        style: { display: 'inline' },
                        innerHTML: checkbox,
                        onchangeChecked: (value: boolean) => {
                            if (value === true) {
                                this.selectedCommits.push(commit)
                            } else {
                                this.selectedCommits =
                                    this.selectedCommits.filter(selectedCommit =>
                                        selectedCommit.hash !== commit.hash)
                            }
                            this.selectedCommits.sort(GitClient.compareCommitsByDate)
                            this.render()
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
                this.refFrom = await renderManager.getValueOf('git-ref-input-from')
                this.refTo = await renderManager.getValueOf('git-ref-input-to')
                this.selectedCommits = await this.gitClient.getCommits(this.refFrom, this.refTo)
                this.render()
            }
        }
    }

    private shapeInputField(id: string, value: string, label: string): RenderElement {
        return {
            type: 'tr',
            children: [
                {
                    type: 'td',
                    innerHTML: label
                },
                {
                    type: 'td',
                    children: [{
                        type: 'input',
                        value: value,
                        id: id
                    }]
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
        const map: Map | Message = getMap()
        if (map instanceof Message || (this.selectedCommits.length === 0 && !this.isUncommittedChangesShown)) {
            return
        }
        if (this.isUncommittedChangesShown) {
            await visualizeChanges(this.selectedCommits, this.uncommittedChanges, this.isZoomingEnabled)
        } else {
            await visualizeChanges(this.selectedCommits, [], this.isZoomingEnabled)
        }
    }

    public override async unrender(): Promise<void> {
        await renderManager.clearContentOf(this.id)
    }
}