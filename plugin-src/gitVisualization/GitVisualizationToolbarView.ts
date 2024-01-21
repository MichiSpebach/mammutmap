import { RenderElementWithId, UltimateWidget } from '../../dist/core/Widget'
import { Map, Message, RenderElement, RenderElements, ToolbarView, getMap, onMapRendered, renderManager } from '../../dist/pluginFacade'
import { ChangedFile, Commit, GitClient } from './GitClient'
import { visualizeChanges } from './gitWitchcraft'

export class GitVisualizationToolbarView extends UltimateWidget implements ToolbarView {

    private isZoomingEnabled: boolean = true

    private gitClient: GitClient | Message = new Message('GitClient not initialized.')
    private commits: Commit[] = []
    private selectedCommits: Commit[] = []

    private refFrom: string = 'HEAD^'
    private refTo: string = 'HEAD'

    private isUncommittedChangesShown = false
    private uncommittedChanges: ChangedFile[] = []

    private readonly numberOfCommitParents: number = 10

    public constructor(
        public readonly id: string
    ) {
        super()
        onMapRendered.subscribe(async (map) => {
            const rootFolderPath: string = map.getRootFolder().getSrcPath()
            this.gitClient = await GitClient.new(rootFolderPath)

            this.commits = []
            this.selectedCommits = []

            this.isUncommittedChangesShown = false
            this.uncommittedChanges = []

            if (this.gitClient instanceof GitClient) {
                this.commits = await this.gitClient.getCommits(`HEAD~${this.numberOfCommitParents}`, 'HEAD')
                this.uncommittedChanges = await this.gitClient.getChangedFiles(['HEAD'])
            }

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

    private getGitClient(): GitClient | never {
        if (this.gitClient instanceof Message) {
            throw new Error(this.gitClient.message)
        }
        return this.gitClient
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
        if (this.gitClient instanceof Message) {
            return this.gitClient.message
        }
        return [
            {
                type: 'table',
                children: [
                    this.shapeInputField('git-ref-input-from', this.refFrom, 'Ref from: '),
                    this.shapeInputField('git-ref-input-to', this.refTo, 'Ref to: ')
                ]
            },
            this.shapeButton(),
            {
                type: 'table',
                children: [
                    this.shapeZoomToggle()]
            },
            await this.shapeCommitToggles()
        ]
    }

    private async shapeCommitToggles(): Promise<RenderElement> {
        const uncommittedChangesToggle: RenderElement = this.shapeUncommittedChangesToggle()
        const commitToggles: RenderElement[] = this.commits.map(commit => this.shapeCommitToggle(commit))
        const toggles: RenderElement[] = [uncommittedChangesToggle, ...commitToggles]
        const moreCommitsButton: RenderElement = {
            type: 'button',
            innerHTML: 'More Commits &#10133;',
            onclick: async () => {
                const numberOfCommits = this.commits.length
                this.commits.push(...await this.getGitClient().getCommits(`HEAD~${numberOfCommits + this.numberOfCommitParents}`, `HEAD~${numberOfCommits}`))
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

    private shapeUncommittedChangesToggle(): RenderElement {
        return this.shapeToggle(this.isUncommittedChangesShown, '&#127381; Uncommitted changes', (value: boolean) => {
            this.isUncommittedChangesShown = value
            this.render()
        })
    }

    private shapeToggle(isChecked: boolean, label: string | undefined, onchangeChecked: (checked: boolean) => void): RenderElement {
        const checkedOrNot: string = isChecked ? ' checked' : ''
        const checkbox: string = '<input type="checkbox" ' + checkedOrNot + '>'
        return {
            type: 'tr',
            children: [
                {
                    type: 'td',
                    style: { display: 'inline' },
                    innerHTML: checkbox,
                    onchangeChecked: onchangeChecked
                },
                {
                    type: 'td',
                    innerHTML: label
                }
            ]
        }
    }

    private shapeCommitToggle(commit: Commit): RenderElement {
        const isChecked: boolean = this.selectedCommits.find(selectedCommit =>
            selectedCommit.hash === commit.hash) !== undefined
        return this.shapeToggle(isChecked, commit.message, (value: boolean) => {
            if (value === true) {
                this.selectedCommits.push(commit)
            } else {
                this.selectedCommits =
                    this.selectedCommits.filter(selectedCommit =>
                        selectedCommit.hash !== commit.hash)
            }
            this.selectedCommits.sort(GitClient.compareCommitsByDate)
            this.render()
        })
    }

    private shapeButton(): RenderElement {
        return {
            type: 'button',
            innerHTML: '&#129668; View Changes between Refs &#129668;',
            onclick: async () => {
                this.refFrom = await renderManager.getValueOf('git-ref-input-from')
                this.refTo = await renderManager.getValueOf('git-ref-input-to')
                this.selectedCommits = await this.getGitClient().getCommits(this.refFrom, this.refTo)
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
        return this.shapeToggle(this.isZoomingEnabled, '&#128269; Zoom to changes?', (value: boolean) => {
            this.isZoomingEnabled = value
        })
    }

    public override async render(): Promise<void> {
        await renderManager.setElementsTo(this.id, await this.shapeInner())
        if (this.gitClient instanceof Message) {
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