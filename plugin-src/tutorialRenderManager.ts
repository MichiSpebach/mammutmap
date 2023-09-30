import { MenuItemFile, applicationMenu, renderManager, coreUtil, RenderPriority, RenderElement } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('tutorialRenderManager.js', new MenuItemFile({label: 'add element', click: () => addElement()}))

async function addElement(): Promise<void> {
	const id: string = coreUtil.generateId()
	const removeButton: RenderElement = {
		type: 'button',
		style: {
			display: 'block',
			margin: 'auto',
			marginTop: '10px',
			cursor: 'pointer'
		},
		onclick: () => renderManager.remove(id),
		children: 'Remove Element'
	}

	await renderManager.addElementTo('body', {
		type: 'div',
		id,
		style: {
			position: 'fixed',
			top: '50%',
			left: '50%',
			transform: 'translate(-50%, -50%)',
			transition: 'all 0.5s',
			backgroundColor: '#1248',
			padding: '10px',
			border: 'solid 1px',
			borderRadius: '4px'
		},
		onmouseenter: () => highlightElement(id),
		onmouseleave: () => resetElement(id),
		children: [
			{type: 'div', children: 'Use RenderPriority.RESPONSIVE to prioritize render operations over other render operations'},
			{type: 'div', children: 'to achieve responsiveness for them when other render operations are queued up.'},
			{type: 'div', children: 'But save RenderPriority.RESPONSIVE for the things that really need to be responsive.'},
			removeButton
		]
	})
}

async function highlightElement(elementId: string): Promise<void> {
	await renderManager.addStyleTo(elementId, {color: 'skyblue'}, RenderPriority.RESPONSIVE)
}

async function resetElement(elementId: string): Promise<void> {
	await renderManager.addStyleTo(elementId, {color: null}, RenderPriority.RESPONSIVE)
}
