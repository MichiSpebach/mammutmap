import { renderManager, RenderPriority } from './RenderManager'
import * as indexHtmlIds from './indexHtmlIds'

export let selectManager: SelectManager // = new SelectManager() // initialized at end of file

class SelectManager {

	private initialized: boolean = false

	private selection: {
		elementId: string
		onSelect(): Promise<void>
		onDeselect(): Promise<void>
	}[] = []

	private async select(selectable: {
		elementId: string
		onSelect(): Promise<void>
		onDeselect(): Promise<void>
	}): Promise<void> {
		this.selection.push(selectable)
		await selectable.onSelect()
	}

	private async deselectIfSelected(elementId: string): Promise<void> {
		const index: number = this.selection.findIndex(selectable => selectable.elementId === elementId)
		if (index < 0) {
			return
		}
		const [element] = this.selection.splice(index, 1)
		await element.onDeselect()
	}

	private async deselectAll(): Promise<void> {
		const selection = this.selection
		this.selection = []
		await Promise.all(selection.map(selectable => selectable.onDeselect()))
	}

	public async addSelectable(options: {
		elementId: string
		onSelect(): Promise<void>
		onDeselect(): Promise<void>
		priority?: RenderPriority
	}): Promise<void> {
		const pros: Promise<unknown>[] = []
		
		pros.push(renderManager.addEventListenerTo(options.elementId, 'click', (clientX:number, clientY: number, ctrlPressed: boolean) => {
			this.select(options)
		}, options.priority))

		if (!this.initialized) {
			this.initialized = true
			pros.push(renderManager.addEventListenerTo(indexHtmlIds.contentId, 'click', (clientX: number, clientY: number, ctrlPressed: boolean) => {
				this.deselectAll()
			}, options.priority))
		}

		await Promise.all(pros)
	}

	public async removeSelectable(elementId: string, priority?: RenderPriority): Promise<void> {
		await Promise.all([
			renderManager.removeEventListenerFrom(elementId, 'click', {priority}),
			this.deselectIfSelected(elementId)
		])
	}
}

selectManager = new SelectManager()