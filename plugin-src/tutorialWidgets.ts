import { SimpleWidget } from '../dist/core/Widget'
import { MenuItemFile, PopupWidget, RenderElements, applicationMenu, coreUtil } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('tutorialWidgets.js', new MenuItemFile({label: 'show popup with widget', click: () => showPopupWithWidget()}))

async function showPopupWithWidget(): Promise<void> {
	const widget = new TutorialWidget()
	PopupWidget.newAndRender({
		title: widget.getId(),
		content: await widget.shape(),
		onClose: () => widget.unrender()
	})
}

class TutorialWidget extends SimpleWidget {
	private counter: number = 0

	public constructor() {
		super(`tutorialWidget${coreUtil.generateId()}`, 'div')
	}

	protected override shapeInner(): RenderElements {
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
