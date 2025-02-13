import { SchedulablePromise, renderManager } from './renderEngine/renderManager'
import { ElementType, RenderElement, RenderElements, Style } from './util/RenderElement'

export type RenderElementWithId = RenderElement & {id: string} // TODO: required at all?

// TODO move into util folder
// TODO rename to RenderingWidget and introduce (Simple)Widget with formHtml() method that does not need to know renderManager
// TODO all gui components should inherit this (Box, BoxHeader, BoxBody, Link, LinkEnd, ...)
export type LegacyWidget = Widget
/** @deprecated use LegacyWidget*/
export abstract class Widget { // TODO rename to OldWidget|LegacyWidget
	//public abstract readonly id: string // TODO: required at all?
	public abstract getId(): string // TODO: remove
	public abstract render(): Promise<void> // TODO for some gui components render needs arguments
	public abstract unrender(): Promise<void>  // TODO: add default implementation?
}

/** @deprecated */
export abstract class BasicWidget extends Widget {
	public async render(): Promise<void> {
		await renderManager.setElementsTo(this.getId(), await this.shapeInner())
	}
	public async unrender(): Promise<void> {
		await renderManager.clearContentOf(this.getId())
	}
	public abstract shape(): RenderElementWithId | Promise<RenderElementWithId>
	protected abstract shapeInner(): RenderElements | Promise<RenderElements>
}

/** @deprecated */
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

	public async shape(): Promise<RenderElementWithId> {
		return {
			type: this.elementType,
			id: this.id,
			style: this.elementStyle,
			children: await this.shapeInner()
		}
	}
}

/** @deprecated */
export abstract class AdvancedWidget extends Widget {
	public async render(): Promise<void> {
		await renderManager.setElementsTo(this.getId(), (await this.shapeInner()).elements)
	}
	public async unrender(): Promise<void> {
		await renderManager.clearContentOf(this.getId())
	}
	public abstract shape(): Promise<{element: RenderElementWithId, rendering: Promise<void>}>
	//public abstract shape(): {element: RenderElementWithId, rendering: Promise<void>} calling shape would be nicer with direct return
	protected abstract shapeInner(): Promise<{elements: RenderElements, rendering: Promise<void>}>
}

/** @deprecated is not fun, too complicated*/
export abstract class UltimateWidget extends Widget { // leads to problems if shape() is called again, then inner rendering finishes first and is overridden by parent rendering
	public abstract shape(): {element: RenderElementWithId, rendering?: Promise<void>}
	//public override abstract render(): {element: RenderElementWithId, rendering?: Promise<void>} // TODO: simply fuse shape and render into one?
}

/** @deprecated possibility to await mounting, also too complicated, can be achieved simpler*/
export abstract class SuperWidget extends Widget {
	public abstract shape(): RenderElement & {onMount: SchedulablePromise<Promise<void>>}
}

export abstract class ShapeWidget { // TODO: rename to Widget
	public abstract shape(): RenderElement & {onMount?: () => void}
}

class ExampleSuperWidget extends SuperWidget {
	private rendering: SchedulablePromise<Promise<void>> = new SchedulablePromise(async () => {'hold'})
	public override getId(): string {
		throw new Error('Method not implemented.')
	}
	public override shape(): RenderElement & { onMount: SchedulablePromise<Promise<void>> } {
		this.rendering.setCommand = () => this.render()
		return {
			type: 'div',
			//onMount: new SchedulablePromise(() => this.render())
			onMount: this.rendering
		}
	}
	public override render(): Promise<void> {
		throw new Error('Method not implemented.')
	}
	public override unrender(): Promise<void> {
		throw new Error('Method not implemented.')
	}
}

const exampleSuperWidget = new ExampleSuperWidget()
//const shape = exampleSuperWidget.shape()
//await shape.onMount.promise

const parentShape: RenderElement & { onMount?: SchedulablePromise<Promise<void>> } = {
	type: 'div',
	children: [
		exampleSuperWidget.shape()
	],
	onMount: new SchedulablePromise(async () => {
		if (Array.isArray(parentShape.children)) {
			await Promise.all(parentShape.children.map(child => (child as RenderElement & { onMount?: SchedulablePromise<Promise<void>> }).onMount ))
		}
	})
}

const parentShapeImproved: RenderElement & { onMount?: SchedulablePromise<Promise<void>>, children: RenderElement[] } = {
	type: 'div',
	children: [
		exampleSuperWidget.shape()
	],
	onMount: new SchedulablePromise(async () => {await Promise.all(parentShapeImproved.children.map((child: any) => child.onMount ))})
}