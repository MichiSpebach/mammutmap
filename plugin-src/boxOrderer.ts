import { SourcelessBox } from '../dist/core/box/SourcelessBox'
import { LocalRect } from '../dist/core/LocalRect'
import { settings } from '../dist/core/settings/settings'
import { Box, contextMenu, FileBox, FolderBox, MenuItemFile, NodeWidget } from '../dist/pluginFacade'
import { EmptySpaceFinder } from '../dist/core/box/EmptySpaceFinder'
import { LayerSystem } from './boxOrderer/LayerSystem'

contextMenu.addFolderBoxMenuItem((box: FolderBox) => new MenuItemFile({label: 'order boxes', click: () => orderBoxes(box)}))

Box.Sidebar.BasicToolkit.add({
	topic: 'childs' as any,
	build: (box: Box) => {
		if (box instanceof FolderBox) {
			return Box.Sidebar.BasicToolkit.buildButton('order boxes', () => orderBoxes(box))
		}
		if (box instanceof FileBox || box instanceof SourcelessBox) {
			return undefined
		}
		console.warn(`boxOrderer::Box.Sidebar.BasicToolkit.add not implemented for BoxType ${box.constructor.name}.`)
		return undefined
	}
})

Box.Sidebar.BasicToolkit.add({
	topic: 'childs' as any,
	build: (box: Box) => {
		if (!settings.getBoolean('developerMode')) {
			return undefined
		}
		if (box instanceof FolderBox) {
			return Box.Sidebar.BasicToolkit.buildButton('unorder boxes', () => unorderBoxes(box))
		}
		if (box instanceof FileBox || box instanceof SourcelessBox) {
			return undefined
		}
		console.warn(`boxOrderer::Box.Sidebar.BasicToolkit.add not implemented for BoxType ${box.constructor.name}.`)
		return undefined
	}
})

async function orderBoxes(box: FolderBox): Promise<void> {
	console.log(`order boxes in '${box.getName()}'...`)
	const layerSystem: LayerSystem = await LayerSystem.newAndAssignNodesToLayers(box)
	console.log(`...ordered boxes in '${box.getName()}'`)
}

async function unorderBoxes(box: FolderBox): Promise<void> {
	console.log(`unorder boxes in '${box.getName()}'...`)
	const childs: (Box|NodeWidget)[] = box.getChilds()
	const spaces: LocalRect[] = new EmptySpaceFinder([]).findEmptySpaces(childs.length)
	await Promise.all(childs.map(async (child, index) => {
		if (child instanceof Box) {
			await child.updateMeasuresAndBorderingLinks({
				x: spaces[index].x,
				y: spaces[index].y
			})
			await child.saveMapData()
		} else {
			await child.setPositionAndRenderAndSave(spaces[index].getMidPosition())
		}
	}))
	console.log(`...unordered boxes in '${box.getName()}'`)
}