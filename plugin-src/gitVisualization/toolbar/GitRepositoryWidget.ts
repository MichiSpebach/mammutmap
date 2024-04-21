import { RenderElementWithId, UltimateWidget } from '../../../dist/core/Widget'
import { coreUtil, RenderElement, RenderElements, renderManager } from '../../../dist/pluginFacade'
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
		if (this.isUncommittedChangesShown) {
			await visualizeChanges(this.selectedCommits, this.uncommittedChanges, this.isZoomingEnabled)
		} else {
			await visualizeChanges(this.selectedCommits, [], this.isZoomingEnabled)
		}
	}

	private async initialize() {
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
		const selectAllToggle: RenderElement = this.shapeSelectAllToggle()
		const uncommittedChangesToggle: RenderElement = this.shapeUncommittedChangesToggle()
		const commitToggles: RenderElement[] = this.commits.map(commit => this.shapeCommitToggle(commit))
		const toggles: RenderElement[] = [selectAllToggle, uncommittedChangesToggle, ...commitToggles]
		const moreCommitsButton: RenderElement = {
			type: 'button',
			innerHTML: 'More Commits &#10133;',
			style: {visibility: this.commits.length < 10 ? 'hidden' : 'visible'},
			onclick: async () => {
				const numberOfCommits = this.commits.length
				this.commits.push(...await this.gitClient.getCommits(`HEAD~${numberOfCommits + this.numberOfCommitParents}`, `HEAD~${numberOfCommits}`))
				await this.render()
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

	private shapeSelectAllToggle(): RenderElement {
		const selectAllToggle = this.shapeToggle({
			id: coreUtil.generateId(),
			isChecked: this.selectedCommits.length === this.commits.length,
			label: '&#9989; Select all',
			title: 'Selects or unselects all changes\\nin the current list',
			onchangeChecked: async (value: boolean) => {
				if (value) {
					this.selectedCommits = this.commits
				} else {
					this.selectedCommits = []
				}
				this.isUncommittedChangesShown = value
				await this.render()
			}
		})
		selectAllToggle.style = {backgroundColor: 'grey'}
		return selectAllToggle
	}

	private shapeUncommittedChangesToggle(): RenderElement {
		return this.shapeToggle({
			id: coreUtil.generateId(),
			isChecked: this.isUncommittedChangesShown,
			label: '&#127381; Uncommitted changes',
			title: 'Staged and un(staged) changes\\nsince last commit',
			onchangeChecked: async (value: boolean) => {
				this.isUncommittedChangesShown = value
				await this.render()
			}
		})
	}

	private shapeToggle(options: {
		id: string,
		isChecked: boolean,
		label?: string,
		title?: string,
		onchangeChecked: (checked: boolean) => void;
	}): RenderElement {
		const checkedOrNot: string = options.isChecked ? ' checked' : ''
		const checkbox: string = `<input type=checkbox ${checkedOrNot} id=${options.id}>`
		return {
			type: 'tr',
			title: options.title,
			children: [
				{
					type: 'td',
					style: {display: 'inline'},
					innerHTML: checkbox,
					onchangeChecked: options.onchangeChecked
				},
				{
					type: 'td',
					innerHTML: `<label for=${options.id}>${options.label}</label>`
				}
			]
		}
	}

	private shapeCommitToggle(commit: Commit): RenderElement {
		const isChecked: boolean = this.selectedCommits.find(selectedCommit =>
			selectedCommit.hash === commit.hash) !== undefined
		const title: string = commit.author_name + '\\n' + commit.date + '\\n' + commit.hash.substring(0, 8)
		return this.shapeToggle({
			id: commit.hash,
			isChecked: isChecked,
			label: commit.message,
			title: title,
			onchangeChecked: async (value: boolean) => {
				if (value) {
					this.selectedCommits.push(commit)
				} else {
					this.selectedCommits =
						this.selectedCommits.filter(selectedCommit =>
							selectedCommit.hash !== commit.hash)
				}
				this.selectedCommits.sort(GitClient.compareCommitsByDate)
				await this.render()
			}
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
				await this.render()
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
		return this.shapeToggle({
			id: coreUtil.generateId(),
			isChecked: this.isZoomingEnabled,
			label: '&#128269; Zoom to changes?',
			onchangeChecked: (value: boolean) => {
				this.isZoomingEnabled = value
			}
		})
	}

	public override async unrender(): Promise<void> {
		await renderManager.clearContentOf(this.id)
	}
}