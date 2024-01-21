import { RenderElementWithId, UltimateWidget } from '../../../dist/core/Widget'
import { Message, RenderElement, RenderElements, renderManager } from '../../../dist/pluginFacade'
import { ChangedFile, Commit, GitClient } from '../GitClient'
import { visualizeChanges } from '../gitWitchcraft'

export class GitRepositoryWidget extends UltimateWidget {

    private isZoomingEnabled: boolean = true

    private commits: Commit[] = []
    private selectedCommits: Commit[] = []

    private refFrom: string = 'HEAD^'
    private refTo: string = 'HEAD'

    private isUncommittedChangesShown = false
    private uncommittedChanges: ChangedFile[] = []

    private readonly numberOfCommitParents: number = 10

    private isInitialized: boolean = false

    public constructor(
        public readonly id: string,
        private readonly gitClient: GitClient
    ) {
        super()
    }

    /**@deprecated simply use id field as it is readonly */
    public override getId(): string {
        return this.id
    }

    public override shape(): { element: RenderElementWithId; rendering?: Promise<void> | undefined } {
        return {
            element: {
                type: 'div',
                id: this.id
            },
            rendering: this.render()
        }
    }


    public override async render(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize()
            this.isInitialized = true
        }
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

    private async initialize() {
        // TODO: Can the initialization be done in the constructor?
        this.commits = await this.gitClient.getCommits(`HEAD~${this.numberOfCommitParents}`, 'HEAD')
        this.selectedCommits = []

        this.isUncommittedChangesShown = false
        this.uncommittedChanges = await this.gitClient.getChangedFiles(['HEAD'])
    }

    private async shapeInner(): Promise<RenderElements> {
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
                this.commits.push(...await this.gitClient.getCommits(`HEAD~${numberOfCommits + this.numberOfCommitParents}`, `HEAD~${numberOfCommits}`))
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
        return this.shapeToggle(this.isZoomingEnabled, '&#128269; Zoom to changes?', (value: boolean) => {
            this.isZoomingEnabled = value
        })
    }

    public override async unrender(): Promise<void> {
        await renderManager.clearContentOf(this.id)
    }
}