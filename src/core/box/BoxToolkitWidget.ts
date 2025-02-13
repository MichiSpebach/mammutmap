import { RenderElement, RenderElements, Style } from '../util/RenderElement'
import { RenderElementWithId, UltimateWidget } from '../Widget'
import { renderManager } from '../renderEngine/renderManager'
import { Box } from './Box'

export class ToolkitTemplate {
	// TODO: implement general ToolkitTemplate to have common appearance for all toolkits
}

type ToolkitTemplateItem = {
	topic?: 'links', // TODO: allow raw strings as topic and warn if not found
	indexWithinTopic?: number,
	build: ((box: Box) => RenderElements|undefined)
}

export class BoxToolkitWidget extends UltimateWidget {

	// TODO: move all static methods related to template into ToolkitTemplate
	public static items: ToolkitTemplateItem[] = [
	//public static template: ToolkitTemplate = new ToolkitTemplate([
		{build: box => this.buildButton('✎ Rename', () => box.openRenamePopupAndAwaitResolve())},
		{topic: 'links', indexWithinTopic: 0, build: box => this.buildButton('→ Link from this box', () => box.links.addWithClickToDropMode())}
	]

	private static addWithSortIn(item: ToolkitTemplateItem): void {
		let insertIndex: number = this.items.findIndex(element => element.topic === item.topic)
		if (insertIndex < 0) {
			this.items.push(item)
			return
		}
		for (;insertIndex < this.items.length; insertIndex++) {
			const insertBefore = this.items[insertIndex]
			if (insertBefore.topic !== item.topic) {
				break
			}
			if ((insertBefore.indexWithinTopic ?? Number.MAX_VALUE) > (item.indexWithinTopic ?? Number.MAX_VALUE)) {
				break
			}
		}
		this.items.splice(insertIndex, 0, item)
	}

	public static add(item: ToolkitTemplateItem): void {
		this.addWithSortIn(item)
	}

	public static addGroup(options: {
		title: string, 
		color?: string, 
		item: ToolkitTemplateItem
	}): void {
		this.addWithSortIn({
			topic: options.item.topic, 
			indexWithinTopic: options.item.indexWithinTopic, 
			build: (box: Box) => this.buildGroup({...options, elements: options.item.build(box)})
		})
	}

	public static buildGroup(options: {title: string, color?: string, elements?: RenderElements}): RenderElement {
		const color: string = options.color ?? 'gray'
		return {
			type: 'div',
			style: {
				marginTop: '8px',
				marginBottom: '8px',
				border: `${color} 1px solid`,
				borderRadius: '6px'
			},
			children: [options.title, ...[options.elements ?? []].flat()]
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

	private static buildFor(box: Box): RenderElements {
		return BoxToolkitWidget.items.flatMap(item => item.build(box) ?? []) // flatMap instead of map to filter out unset elements
		//return BoxToolkitWidget.items.map(item => item.build(box)).filter((element): element is RenderElement => !!element) // this would also be possible
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
			/*style: {
				display: 'flex',
				flexDirection: 'column-reverse'
			},*/
			children: this.shapeInner()
		}
		return {element}
	}

	private shapeInner(): RenderElements {
		return BoxToolkitWidget.buildFor(this.referenceBox)
	}

	public override async render(): Promise<void> {
		await renderManager.setElementsTo(this.getId(), this.shapeInner())
	}

	public override async unrender(): Promise<void> {
		await renderManager.clearContentOf(this.getId())
	}
}