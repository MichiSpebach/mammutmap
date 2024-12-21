import { map } from '../../dist/core/Map'
import { mouseDownDragManager } from '../../dist/core/mouseDownDragManager'
import { HoverManager } from '../../dist/core/HoverManager'
import { util } from '../../dist/core/util/util'
import { RenderElementWithId, UltimateWidget } from '../../dist/core/Widget'
import { Box, RenderElement, renderManager, RenderPriority, ToolbarView } from '../../dist/pluginFacade'
import { Drawing } from './Drawing'

export class PaintToolbarView implements ToolbarView {

	private readonly widget = new PaintToolbarViewWidget()

	public getName(): string {
		return 'Paint'
	}
	
	public getWidget(): UltimateWidget {
		return this.widget
	}
}

export class PaintToolbarViewWidget extends UltimateWidget {

	public readonly id = 'paintToolbarViewWidget-'+util.generateId()

	private active: {
		color: string,
		escapeListener: () => void,
		drawing?: Drawing
	} | undefined = undefined

	public override getId(): string {
		return this.id
	}

	public override shape(): { element: RenderElementWithId; rendering?: Promise<void> } {
		return {element: {
			id: this.id,
			type: 'div',
			children: [
				this.shapeButton('red'),
				this.shapeButton('green'),
				this.shapeButton('blue'),
				this.shapeButton('yellow'),
				this.shapeButton('black'),
				this.shapeButton('white'),
				{
					type: 'button',
					style: {
						margin: '5px',
						width: '30px',
						height: '30px',
						verticalAlign: 'top',
						cursor: 'pointer'
					},
					onclick: () => this.deactivateDraw(),
					children: 'X'
				}
			]
		}}
	}

	private shapeButton(color: string): RenderElement {
		return {
			type: 'button',
			style: {
				margin: '5px',
				width: '30px',
				height: '30px',
				backgroundColor: color,
				cursor: 'pointer'
			},
			onclick: () => this.activateDraw(color)
		}
	}

	private async activateDraw(color: string): Promise<void> {
		if (!map) {
			console.warn('Open a folder before drawing.')
			return
		}
		if (this.active) {
			this.active.color = color
			return
		}
		this.active = {
			color,
			escapeListener: async () => {
				if (!this.active) {
					console.warn('Paint: !this.active')
					return
				}
				if (this.active.drawing) {
					await renderManager.remove(this.active.drawing.id)
					this.active.drawing = undefined
					await this.setHintToCancelStroke(false)
					await this.setHintToEscapeDrawMode(true)
				} else {
					await this.deactivateDraw()
				}
			}
		}
		
		await mouseDownDragManager.addDraggable({
			elementId: map.getRootFolder().getId(),
			onDragStart: async (eventResult) => {
				if (!this.active) {
					console.warn('Paint: !this.active')
					return
				}
				const focusedBox = (HoverManager as any).state.hovering
				if (focusedBox instanceof Box) {
					this.active.drawing = await Drawing.new(focusedBox, this.active.color, eventResult.position)
					await this.setHintToEscapeDrawMode(false)
					await this.setHintToCancelStroke(true)
				}
			},
			onDrag: async (position) => {
				if (!this.active?.drawing) {
					// drawing was canceled
					return
				}
				await this.active.drawing.draw(position)
			},
			onDragEnd: async (position) => {
				if (!this.active?.drawing) {
					// drawing was canceled
					return
				}
				await this.active.drawing.draw(position)
				this.active.drawing = undefined
				await this.setHintToCancelStroke(false)
				await this.setHintToEscapeDrawMode(true)
			},
			priority: RenderPriority.RESPONSIVE
		})
		await renderManager.addKeydownListenerTo('body', 'Escape', this.active.escapeListener, RenderPriority.RESPONSIVE)
		await this.setHintToEscapeDrawMode(true)
	}

	private async deactivateDraw(): Promise<void> {
		if (!map) {
			console.warn('Open a folder before drawing.')
			return
		}
		if (!this.active) {
			console.log('No color selected.')
			return
		}
		
		await Promise.all([
			mouseDownDragManager.removeDraggable(map.getRootFolder().getId(), RenderPriority.RESPONSIVE),
			renderManager.removeEventListenerFrom('body', 'keydown', {listenerCallback: this.active.escapeListener, priority: RenderPriority.RESPONSIVE}),
			this.setHintToEscapeDrawMode(false)
		])

		this.active = undefined
	}

	private async setHintToEscapeDrawMode(active: boolean): Promise<void> {
		await util.setHint('Press Escape to end draw mode', active)
	}
	
	private async setHintToCancelStroke(active: boolean): Promise<void> {
		await util.setHint('Press Escape to cancel stroke', active)
	}
	
	public override async render(): Promise<void> {}

	public override async  unrender(): Promise<void> {}
}