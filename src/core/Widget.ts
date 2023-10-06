import { renderManager } from './RenderManager'
import { ElementType, RenderElement, RenderElements, Style } from './util/RenderElement'

export type RenderElementWithId = RenderElement & {id: string}

// TODO move into util folder
// TODO rename to RenderingWidget and introduce (Simple)Widget with formHtml() method that does not need to know renderManager
// TODO all gui components should inherit this (Box, BoxHeader, BoxBody, Link, LinkEnd, ...)
export abstract class Widget {
	public abstract getId(): string
	public abstract render(): Promise<void> // TODO for some gui components render needs arguments
	public abstract unrender(): Promise<void>  // TODO: add default implementation?
}

export abstract class BasicWidget extends Widget {
	public async render(): Promise<void> {
		await renderManager.setElementsTo(this.getId(), await this.shapeFormInner())
	}
	public async unrender(): Promise<void> {
		await renderManager.clearContentOf(this.getId())
	}
	public abstract shapeForm(): RenderElementWithId | Promise<RenderElementWithId>
	protected abstract shapeFormInner(): RenderElements | Promise<RenderElements>
}

export abstract class SimpleWidget extends BasicWidget {
	public abstract readonly id: string
	public abstract readonly type: ElementType
	protected abstract readonly style?: Style

	public override getId(): string {
		return this.id
	}

	public async shapeForm(): Promise<RenderElementWithId> {
		return {
			type: this.type,
			id: this.id,
			style: this.style,
			children: await this.shapeFormInner()
		}
	}
}