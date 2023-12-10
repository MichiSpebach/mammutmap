import { RenderElement, RenderElements, Style } from '../util/RenderElement'
import { RenderElementWithId, UltimateWidget } from '../Widget'
import { renderManager } from '../RenderManager'
import { Box } from './Box'

export class ToolkitTemplate {
	// TODO: implement general ToolkitTemplate to have common appearance for all toolkits
}

export class BoxToolkitWidget extends UltimateWidget {

	// TODO: move all static methods related to template into ToolkitTemplate
	public static elementBuilders: ((box: Box) => RenderElements|undefined)[] = [
	//public static template: ToolkitTemplate = new ToolkitTemplate([
		box => this.buildButton('Rename', () => box.openRenamePopupAndAwaitResolve()),
		box => this.buildButton('Link from this box', () => box.links.addWithClickToDropMode())
	]

	public static addElements(elementsBuilder: (box: Box) => RenderElements|undefined): void {
		this.elementBuilders.push(elementsBuilder)
	}

	// TODO: useful? why not always use addElements?
	public static addElement(elementBuilder: (box: Box) => RenderElement|undefined): void {
		this.elementBuilders.push(elementBuilder)
	}

	public static addGroup(options: {title: string, color?: string, elementsBuilder: (box: Box) => (string|RenderElement)[]}): void {
		this.elementBuilders.push((box: Box) => this.buildGroup({...options, elements: options.elementsBuilder(box)}))
	}

	public static buildGroup(options: {title: string, color?: string, elements: (string|RenderElement)[]}): RenderElement {
		const color: string = options.color ?? 'gray'
		return {
			type: 'div',
			style: {
				marginTop: '8px',
				marginBottom: '8px',
				border: `${color} 1px solid`,
				borderRadius: '6px'
			},
			children: [
				options.title,
				...options.elements,
				//...[options.elements].flatMap(element => element) // for general RenderElements that are not always arrays, but looks complicated and not needed
			]
		}
	}

	public static buildButton(text: string, onclick: () => void): RenderElement {
		return {
			type: 'button',
			style: {display: 'block', margin: '4px', cursor: 'pointer'},
			onclick,
			children: text
		}
	}

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
		return BoxToolkitWidget.elementBuilders.flatMap(builder => builder(this.referenceBox) ?? []) // flatMap instead of map to filter out unset elements
		//return BoxToolkitWidget.elementBuilders.map(builder => builder(this.referenceBox)).filter((element): element is RenderElement => !!element) // this would also be possible
	}

	public override async render(): Promise<void> {
		await renderManager.setElementsTo(this.getId(), this.shapeInner())
	}

	public override async unrender(): Promise<void> {
		await renderManager.clearContentOf(this.getId())
	}
}