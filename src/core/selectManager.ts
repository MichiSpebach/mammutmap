import { renderManager, RenderPriority } from './renderEngine/renderManager'
import * as indexHtmlIds from './indexHtmlIds'
import { settings } from './settings/settings'

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
		if (this.selection.find(selected => selected.elementId === selectable.elementId)) {
			await this.deselectIfSelected(selectable.elementId)
			return
		}
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
		type: 'box'|'link'
		onSelect(): Promise<void>
		onDeselect(): Promise<void>
		priority?: RenderPriority
	}): Promise<void> {
		const pros: Promise<unknown>[] = []
		
		pros.push(renderManager.addEventListenerTo(options.elementId, 'click', (clientX: number, clientY: number, ctrlPressed: boolean) => {
			if (!ctrlPressed && options.type === 'box' && settings.getBoolean('selectBoxesWithCtrlOnly')) {
				this.deselectAll()
				return
			}
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

	public async removeSelectable(elementId: string, callOnDeselectIfSelected: boolean = false, priority?: RenderPriority): Promise<void> {
		const pros: Promise<void>[] = []
		pros.push(renderManager.removeEventListenerFrom(elementId, 'click', {priority}))
		if (callOnDeselectIfSelected) {
			pros.push(this.deselectIfSelected(elementId))
		}
		await Promise.all(pros)
	}
}

selectManager = new SelectManager()