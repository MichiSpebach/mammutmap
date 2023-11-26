import { renderManager } from '../RenderManager'
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
			style: {
				backgroundColor: '#0808',
				padding: '4px',
				borderRadius: '4px',
				...additionalStyle
			}
		}
	}

	public async set(options: {text: string, percent?: number}): Promise<void> {
		if (options.percent) {
			const textElement: RenderElement = {
				type: 'span',
				children: options.text,
				style: {
					position: 'relative'
				}
			}
			const percentElement: RenderElement = {
				type: 'div',
				style: {
					position: 'absolute',
					width: options.percent+'%',
					height: '100%',
					backgroundColor: 'steelBlue',
					top: '0px',
					left: '0px',
					borderRadius: '4px',
				}
			}
			return renderManager.setElementsTo(this.id, [percentElement, textElement])
		} else {
			return renderManager.setElementsTo(this.id, options.text)
		}
	}

}