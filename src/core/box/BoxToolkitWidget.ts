import { RenderElements } from '../util/RenderElement'
import { RenderElementWithId, UltimateWidget } from '../Widget'
import { renderManager } from '../RenderManager'
import { Box } from './Box'

export class BoxToolkitWidget extends UltimateWidget {

	public constructor(
        public readonly referenceBox: Box
	) {
		super()
	}

	public override getId(): string {
		return this.referenceBox.getId()+'-toolkit'
	}

	public override shape(): { element: RenderElementWithId; rendering?: Promise<void> | undefined } {
		const element: RenderElementWithId = {
			type: 'div',
			id: this.getId(),
			children: this.shapeInner()
		}
		return {element}
	}

	private shapeInner(): RenderElements {
		return [
			{
				type: 'button',
                onclick: () => this.referenceBox.links.addWithClickToDropMode(),
				children: 'Link from this box'
			}
		]
	}

	public override async render(): Promise<void> {
		await renderManager.setElementsTo(this.getId(), this.shapeInner())
	}

	public override async unrender(): Promise<void> {
		await renderManager.clearContentOf(this.getId())
	}
}