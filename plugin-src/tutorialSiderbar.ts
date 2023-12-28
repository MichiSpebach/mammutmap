import { RenderElementWithId, UltimateWidget } from '../dist/core/Widget'
import { MenuItemFile, RenderElement, RenderElements, ToolbarView, applicationMenu, coreUtil, mainWidget, renderManager } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('tutorialSiderbar.js', new MenuItemFile({label: 'add to sidebar', click() {
	mainWidget.sidebar.addView(new TutorialToolkit(`tutorialToolkit${coreUtil.generateId()}`))
}}))

class TutorialToolkit extends UltimateWidget implements ToolbarView {

	public constructor(
		public readonly id: string
	) {
		super()
	}
	
	public getName(): string {
		return 'TutorialToolkit'
	}
	
	public getWidget(): UltimateWidget {
		return this
	}

	/**@deprecated simply use use id field as it is readonly */
	public override getId(): string {
		return this.id
	}

	public override shape(): { element: RenderElementWithId; rendering?: Promise<void> | undefined } {
		return {element: {
			type: 'table',
			id: this.id,
			children: this.shapeInner()
		}}
	}

	private shapeInner(): RenderElements {
		return [
			this.shapeRow('Option 1'),
			this.shapeRow('Option 2'),
			this.shapeRow('Option 3'),
			this.shapeRow('Option 4')
		]
	}

	private shapeRow(text: string): RenderElement {
		return {
			type: 'tr',
			children: [
				{
					type: 'td',
					innerHTML: '<input type="checkbox">',
					onchangeChecked: (value: boolean) => {
						console.log(`${text} is now ${value}`)
					}
				},
				{
					type: 'td',
					children: text
				}
			]
		}
	}

	public override async render(): Promise<void> {
		await renderManager.setElementsTo(this.id, this.shapeInner())
	}

	public override async unrender(): Promise<void> {
		await renderManager.clearContentOf(this.id)
	}
}