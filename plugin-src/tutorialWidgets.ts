import { RenderElementWithId, SimpleWidget } from '../dist/core/Widget'
import { ElementType, MenuItemFile, PopupWidget, RenderElement, RenderElements, Style, applicationMenu, coreUtil } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('tutorialWidgets.js', new MenuItemFile({label: 'show popup with widget', click: () => showPopupWithWidget()}))

async function showPopupWithWidget(): Promise<void> {
	const widget = new TutorialWidget()
	PopupWidget.newAndRender({
		title: widget.getId(),
		content: await widget.shapeForm(),
		onClose: () => widget.unrender()
	})
}

class TutorialWidget extends SimpleWidget {
	public override readonly id: string = `tutorialWidget${coreUtil.generateId()}`
	public override readonly type: ElementType = 'div'
	protected override readonly style?: Style | undefined
	private counter: number = 0

	protected override shapeFormInner(): RenderElements {
		return [
			{
				type: 'button',
				style: {width: '250px'},
				onclick: () => {this.counter++; this.render()},
				children: '+1'
			},
			{
				type: 'div',
				style: {color: `rgb(0, ${this.counter*10}, 0)`},
				children: `Count is ${this.counter}.`
			}
		]
	}

}
