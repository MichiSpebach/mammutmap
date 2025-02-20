# renderEngine
A library that renders TypeScript objects as HTML.\
There is no JavaScript syntax extension or other syntactic sugar involved, just TypeScript.

## Examples
### Hello World:
index.html:
```HTML
<!DOCTYPE html>
<html>
	<head>
		<title>Hello TypeScript World</title>
		<script type="module" src="./index.js"></script>
	</head>
	<body id="body">
	</body>
</html>
```

index.ts:
```TypeScript
import * as domAdapter from 'renderEngine/domAdapter'
import { DirectDomAdapter } from 'renderEngine/DirectDomAdapter'
import { renderManager } from 'renderEngine/renderManager'

domAdapter.init(new DirectDomAdapter()) // when running directly in a browser
//domAdapter.init(new ElectronIpcDomAdapter(browserWindow)) // to render from Electron main thread in render thread
//domAdapter.init(new UnrealEngineAdapter()) // something like this could also be implemented

renderManager.addElementTo('body', {
	type: 'div',
	style: {
		textAlign: 'center',
		fontSize: '50px'
	},
	children: 'Hello TypeScript World'
})
```

### Element Nesting, Style Spreading, Events:
index.ts:
```TypeScript
import * as domAdapter from 'renderEngine/domAdapter'
import { DirectDomAdapter } from 'renderEngine/DirectDomAdapter'
import { renderManager } from 'renderEngine/renderManager'
import { RenderElement, Style } from 'renderEngine/RenderElement'

domAdapter.init(new DirectDomAdapter())

const buttonStyle: Style = {
	margin: '4px',
	padding: '4px 8px',
	cursor: 'pointer'
}

renderManager.addElementsTo('body', [
	{
		type: 'div',
		id: 'items',
		style: {
			position: 'absolute',
			top: '0px',
			left: '0px',
			width: '100%',
			height: '100%'
		}
	},
	{
		type: 'div',
		style: {
			position: 'relative',
			margin: 'auto',
			width: 'fit-content'
		},
		children: [
			{
				type: 'button',
				style: {
					...buttonStyle,
					color: 'green'
				},
				onclick: () => renderManager.addElementTo('items', createItem()),
				children: 'add item'
			},
			{
				type: 'button',
				style: {
					...buttonStyle,
					color: 'red'
				},
				onclick: () => renderManager.clearContentOf('items'),
				children: 'clear items'
			}
		]
	}
])

function createItem(): RenderElement {
	return {
		type: 'div',
		style: {
			position: 'absolute',
			top: `${Math.random()*100}%`,
			left: `${Math.random()*100}%`
		},
		children: 'item'
	}
}
```

### Stateful Widgets
index.ts: like above but replace `createItem()` with `new ItemWidget().shape()`:
```TypeScript
				//...
				onclick: () => renderManager.addElementTo('items', new ItemWidget().shape()),
				//...
```

ItemWidget.ts:
```TypeScript
export class ItemWidget {
	private readonly id: string = `item${crypto.randomUUID()}`
	private position: {percentX: number, percentY: number}

	public constructor(position?: {percentX: number, percentY: number}) {
		this.position = position ?? {percentX: Math.random()*100, percentY: Math.random()*100}
	}

	public shape(): RenderElement {
		return {
			type: 'div',
			id: this.id,
			style: {
				position: 'absolute',
				...this.getPositionStyle()
			},
			children: [
				{
					type: 'button',
					children: '<',
					onclick: () => this.move(-1)
				},
				'item',
				{
					type: 'button',
					children: '>',
					onclick: () => this.move(1)
				}
			]
		}
	}

	private async move(value: number): Promise<void> {
		this.position.percentX += value
		await renderManager.addStyleTo(this.id, this.getPositionStyle())
	}

	private getPositionStyle(): Style {
		return {
			top: `${this.position.percentY}%`,
			left: `${this.position.percentX}%`
		}
	}
}
```