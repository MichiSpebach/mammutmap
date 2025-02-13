import { renderManager } from '../renderEngine/renderManager'
import { RenderElement, Style } from './RenderElement'
import { util } from './util'

export class ProgressBarWidget /*extends Widget*/ {

	public static async newAndRenderInMainWidget(): Promise<ProgressBarWidget> {
		const widget = new ProgressBarWidget(util.generateId())
		await renderManager.addElementTo('body', widget.shape({ // TODO: calling mainWidget.addProgressBar(widget) would lead to cycle, find better solution, maybe callback?
			position: 'fixed', 
			bottom: 'calc(15% + 8px)', 
			left: '50%', 
			transform: 'translateX(-50%)',
			width: '25%'
		}))
		return widget
	}

	public async finishAndRemove(): Promise<void> {
		await renderManager.remove(this.id)
	}

	public constructor(
		public readonly id: string
	) {}

	public shape(additionalStyle?: Style): RenderElement {
		return {
			type: 'div',
			id: this.id,
			style: additionalStyle
		}
	}

	public async set(options: {text: string, percent?: number, details?: string}): Promise<void> {
		if (options.details) {
			return renderManager.setElementsTo(this.id, [this.shapeBar(options), {
				type: 'div',
				style: {fontSize: 'small'},
				children: options.details
			}])
		} else {
			return renderManager.setElementsTo(this.id, this.shapeBar(options))
		}
	}

	private shapeBar(options: {text: string, percent?: number}): RenderElement {
		const children: RenderElement[] = []
		if (options.percent) {
			children.push({
				type: 'div',
				style: {
					position: 'absolute',
					width: options.percent+'%',
					height: '100%',
					backgroundColor: 'steelBlue',
					top: '0px',
					left: '0px',
					borderRadius: '4px'
				}
			})
		}
		children.push({
			type: 'span',
			children: options.text,
			style: {
				position: 'relative'
			}
		})

		return {
			type: 'div',
			style: {
				position: 'relative',
				backgroundColor: '#0808',
				padding: '4px',
				borderRadius: '4px'
			},
			children
		}
	}

}