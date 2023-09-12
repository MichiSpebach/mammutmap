import { MenuItemFile, applicationMenu, PopupWidget } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('tutorialHelloWorld.js', new MenuItemFile({label: 'perform "Hello World!"', click: () => performHelloWorld()}))

function performHelloWorld(): void {
	PopupWidget.newAndRender({
		title: 'Hello World!',
		content: {
			type: 'div',
			style: {color: 'lightgreen', cursor: 'pointer'},
			onclick: () => console.log('Hello World!'),
			children: 'Hello, nice to see you!'
		},
		onClose: () => console.log('Have a nice day!')
	})
}