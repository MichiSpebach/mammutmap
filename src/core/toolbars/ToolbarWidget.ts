import { renderManager } from '../renderEngine/renderManager'
import { Widget } from '../Widget'
import { log } from '../logService'
import { RenderElement, RenderElements, Style } from '../util/RenderElement'
import { ToolbarView } from './ToolbarView'

export class ToolbarWidget extends Widget {
	public readonly id: string
	private readonly views: ToolbarView[] = []
	private readonly hideHeader: boolean|'auto'
	private selectedView: ToolbarView|undefined
	private beingRendered: boolean = false

	public static shapeHeaderButton(selected: boolean, additional: Omit<RenderElement, 'type'>): RenderElement {
		return {
			type: 'button',
			...additional,
			style: this.getHeaderButtonStyle(selected, additional.style),
		}
	}

	public static getHeaderButtonStyle(selected: boolean, additionalStyle?: Style): Style {
		return {
			padding: '4px 8px',
			fontSize: 'inherit',
			color: 'inherit',
			backgroundColor: selected ? 'inherit' : '#222',
			border: 'none',
			borderRight: '1px solid gray',
			borderBottom: selected ? 'none' : '1px solid gray',
			cursor: 'pointer',
			...additionalStyle
		}
	}

	public constructor(id: string, options?: {hideHeader?: boolean|'auto'}) {
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

		if (this.beingRendered) {
			await renderManager.setElementsTo(this.getId(), this.shapeInner())
		}
	}

	public async selectView(view: ToolbarView): Promise<void> {
		if (!this.views.includes(view)) {
			log.warning(`ToolbarWidget::selectView(view: ${view.getName()}) view not included, call addView(view) first.`)
		}
		const selectedViewBefore: ToolbarView|undefined = this.selectedView
		this.selectedView = view
		if (this.beingRendered) {
			await Promise.all([
				selectedViewBefore?.getWidget().unrender(),
				renderManager.setElementsTo(this.getId(), this.shapeInner())
			])
		}
	}

	public async render(): Promise<void> {
		if (this.beingRendered) {
			return
		}
		this.beingRendered = true

		await renderManager.setElementsTo(this.getId(), this.shapeInner())
	}

	public async unrender(): Promise<void> {
		if (!this.beingRendered) {
			return
		}
		this.beingRendered = false
		
		if (this.selectedView) {
			await this.selectedView.getWidget().unrender()
		}
		await renderManager.setContentTo(this.getId(), '')
	}

	public shapeOuter(additionalStyle?: Style): RenderElement {
		return {
			type: 'div',
			id: this.id,
			style: {
				overflow: 'auto',
				...additionalStyle
			}
		}
	}

	private shapeInner(): RenderElements {
		const elements: RenderElements = this.hideHeader === true || this.hideHeader === 'auto' && this.views.length < 2
			? []
			: [this.shapeHeader()]

		if (this.views.length === 0) {
			elements.push('no ToolbarViews added')
			return elements
		} else if (!this.selectedView) {
			elements.push('no ToolbarView selected')
			return elements
		}
		elements.push(this.selectedView.getWidget().shape().element)
		return elements
	}

	private shapeHeader(): RenderElement {
		const elements: RenderElement[] = []

		for (const view of this.views) {
			const selected: boolean = view === this.selectedView
			elements.push(ToolbarWidget.shapeHeaderButton(selected, {
				onclick: () => this.selectView(view),
				children: view.getName()
			}))
		}

		return {
			type: 'div',
			style: {position: 'sticky', top: '0', backgroundColor: 'inherit'},
			children: elements
		}
	}

}
