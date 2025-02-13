import { RenderPriority, renderManager } from '../renderEngine/renderManager'
import { ToolbarWidget } from '../toolbars/ToolbarWidget'
import { RenderElement, Style } from '../util/RenderElement'
import { util } from '../util/util'
import { log } from '../logService'
import { BoxToolkitWidget } from './BoxToolkitWidget'
import { Box } from './Box'

export class BoxSidebar {
	public static readonly BasicToolkit: typeof BoxToolkitWidget = BoxToolkitWidget
	private readonly referenceBox: Box
	private readonly id: string
	private readonly toolbar: ToolbarWidget
	public mounted: boolean = false
	private rendered: boolean = false

	public constructor(referenceBox: Box) {
		this.referenceBox = referenceBox
		this.id = referenceBox.getId()+'-sidebar'+util.generateId() // additional util.generateId() prevents possible collision with old sidebar that is about to be removed TODO: find better solution
		this.toolbar = new ToolbarWidget(this.getId()+'-toolbar', {hideHeader: 'auto'})
		this.toolbar.addView({getName: () => 'Box Toolkit', getWidget: () => new BoxToolkitWidget(this.referenceBox)})
	}

	public getId(): string {
		return this.id
	}

	public shape(additionalStyle?: Style): RenderElement {
		return {
			type: 'div',
			id: this.getId(),
			style: {
				overflow: 'hidden',
				...additionalStyle
			},
			children: this.toolbar.shapeOuter({
				//display: 'flex',
				//flexDirection: 'column-reverse', // scrollFromButton would fit better to zooming
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

	public async render(options: {priority: RenderPriority, awaitSlideAnimation: boolean}): Promise<void> {
		if (!this.mounted) {
			log.warning(`BoxSidebar::render() called although widget is not mounted.`)
			return
		}

		this.rendered = true
		const pros: Promise<void>[] = []
		if (options.awaitSlideAnimation) {
			pros.push(renderManager.addStyleTo(this.toolbar.id, {transform: 'translateX(0%)', transitionDuration: '200ms'}, options.priority))
		}
		pros.push(this.toolbar.render())
		await Promise.all(pros)
	}

	public async unrender(options: {priority: RenderPriority, awaitSlideAnimation: boolean}): Promise<void> {
		if (!this.mounted) {
			log.warning(`BoxSidebar::unrender() called although widget is not mounted.`)
			return
		}

		if (options.awaitSlideAnimation) {
			if (!this.rendered) {
				return
			}
			await renderManager.addStyleTo(this.toolbar.id, {transform: 'translateX(-100%)', transitionDuration: '200ms'}, options.priority)
			await util.wait(200)
		}
		if (!this.rendered) {
			return
		}
		this.rendered = false
		await this.toolbar.unrender()
	}
}