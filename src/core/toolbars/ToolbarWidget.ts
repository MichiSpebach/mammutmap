import { renderManager } from '../RenderManager'
import { Widget } from '../Widget'
import { RenderElement, RenderElements, Style } from '../util/RenderElement'
import { ToolbarView } from './ToolbarView'

export class ToolbarWidget extends Widget {
	private readonly id: string
	private readonly views: ToolbarView[] = []
	private readonly hideHeader: boolean
	private selectedView: ToolbarView|undefined
	private shouldBeRendered: boolean = false

	public constructor(id: string, options?: {hideHeader?: boolean}) {
		super()
		this.id = id
		this.hideHeader = options?.hideHeader ?? false
	}

	public getId(): string {
		return this.id
	}

	public async addView(view: ToolbarView): Promise<void> {
		this.views.push(view)

		if (!this.selectedView) {
			this.selectedView = this.views[0]
		}

		if (this.shouldBeRendered) {
			await this.render()
		}
	}

	public async render(): Promise<void> {
		this.shouldBeRendered = true

		await renderManager.setElementsTo(this.getId(), this.shapeInner())
		await this.renderSelectedView()
	}

	// TODO: find better solution than needing to call this method from the outside
	public async renderSelectedView(): Promise<void> {
		if (this.selectedView) {
			await this.selectedView.getWidget().render()
		}
	}

	public async unrender(): Promise<void> {
		this.shouldBeRendered = false
		
		if (this.selectedView) {
			await this.selectedView.getWidget().unrender()
		}
		await renderManager.setContentTo(this.getId(), '')
	}

	public shape(additionalStyle?: Style): RenderElement {
		return {
			type: 'div',
			id: this.id,
			style: additionalStyle,
			children: this.shapeInner()
		}
	}

	private shapeInner(): RenderElements {
		const elements: RenderElements = []

		if (!this.hideHeader) {
			elements.concat(this.shapeHeader())
		}

		if (this.views.length === 0) {
			elements.push('no ToolbarViews added')
			return elements
		} else if (!this.selectedView) {
			elements.push('no ToolbarView selected')
			return elements
		}

		elements.push({
			type: 'div',
			id: this.selectedView.getWidget().getId()
		})
		/*;(async () => {
			await this.mounting // TODO
			await this.selectedView.getWidget().render()
		})()*/
		return elements
	}

	private shapeHeader(): RenderElement[] {
		const elements: RenderElement[] = []

		for (const view of this.views) {
			const selected: boolean = view === this.selectedView
			elements.push({
				type: 'span',
				style: {fontWeight: selected ? 'bold' : undefined},
				children: view.getName()
			})
		}

		return elements
	}

}
