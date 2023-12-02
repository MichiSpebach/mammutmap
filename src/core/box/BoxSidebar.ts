import { RenderPriority, renderManager } from '../RenderManager'
import { ToolbarWidget } from '../toolbars/ToolbarWidget'
import { RenderElement, Style } from '../util/RenderElement'
import { util } from '../util/util'

export class BoxSidebar {
	private readonly toolbar: ToolbarWidget

	public constructor(
		public readonly id: string
	) {
		this.toolbar = new ToolbarWidget(this.id+'-toolbar')
	}

	public shape(additionalStyle?: Style): RenderElement {
		return {
			type: 'div',
			id: this.id,
			style: {
				overflow: 'hidden',
				...additionalStyle
			},
			children: this.toolbar.shapeOuter({
				height: '100%',
				boxSizing: 'border-box',
				paddingLeft: '4px',
				paddingRight: '4px',
				backgroundColor: '#47b8',
				border: '1px solid slategrey',
				borderLeft: 'none',
				borderTopRightRadius: '6px',
				borderBottomRightRadius: '6px',
				transform: 'translateX(-100%)',
				transitionProperty: 'transform'
			})
		}
	}

	public async renderWithSlide(priority: RenderPriority): Promise<void> {
		await Promise.all([
			this.render(),
			renderManager.addStyleTo(this.toolbar.id, {transform: 'translateX(0%)', transitionDuration: '200ms'}, priority)
		])
	}

	public async unrenderWithSlide(priority: RenderPriority): Promise<void> {
		await renderManager.addStyleTo(this.toolbar.id, {transform: 'translateX(-100%)', transitionDuration: '200ms'}, priority)
		await util.wait(200)
		await this.unrender()
	}

	public render(): Promise<void> {
		return this.toolbar.render()
	}

	public unrender(): Promise<void> {
		return this.toolbar.unrender()
	}
}