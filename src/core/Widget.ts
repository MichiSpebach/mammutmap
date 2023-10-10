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
	// TODO: rename to "shape" because "form" could be confused with <form> element in html context
	public abstract shapeForm(): RenderElementWithId | Promise<RenderElementWithId>
	protected abstract shapeFormInner(): RenderElements | Promise<RenderElements>
}

export abstract class SimpleWidget extends BasicWidget {
	public readonly id: string
	private readonly elementType: ElementType
	private readonly elementStyle?: Style

	public constructor(id: string, elementType: ElementType, elementStyle?: Style) {
		super()
		this.id = id
		this.elementType = elementType
		this.elementStyle = elementStyle
	}

	public override getId(): string {
		return this.id
	}

	public async shapeForm(): Promise<RenderElementWithId> {
		return {
			type: this.elementType,
			id: this.id,
			style: this.elementStyle,
			children: await this.shapeFormInner()
		}
	}
}