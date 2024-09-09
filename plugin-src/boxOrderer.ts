import { SourcelessBox } from '../dist/core/box/SourcelessBox'
import { LocalRect } from '../dist/core/LocalRect'
import { settings } from '../dist/core/settings/settings'
import { Box, contextMenu, FileBox, FolderBox, Link, LocalPosition, MenuItemFile, NodeWidget } from '../dist/pluginFacade'
import { Layer } from './boxOrderer/Layer'
import { Suggestion } from './boxOrderer/LayerSide'
import { NodeToOrder } from './boxOrderer/NodeToOrder'
import { EmptySpaceFinder } from '../dist/core/box/EmptySpaceFinder'

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
	const childs: (Box|NodeWidget)[] = box.getChilds()
	const borderingLinks: Link[] = box.borderingLinks.getAll()

	const layer0Nodes: NodeToOrder[] = []
	for (const link of borderingLinks) {
		const child: Box|NodeWidget|undefined = getEndThatIsInBox(link)
		if (child) {
			const line: {from: LocalPosition, to: LocalPosition} = await link.getLineInManagingBoxCoords()
			const lineInLocalCoords = {
				from: box.transform.outerCoordsRecursiveToLocal(link.getManagingBox(), line.from),
				to: box.transform.outerCoordsRecursiveToLocal(link.getManagingBox(), line.to)
			}
			const intersections: LocalPosition[] = new LocalRect(0, 0, 100, 100).calculateIntersectionsWithLine(lineInLocalCoords)
			if (intersections.length < 1) {
				console.warn(`boxOrderer.orderBoxes(box: '${box.getName()}') intersections.length < 1`)
				layer0Nodes.push({node: child, wishPosition: new LocalPosition(50, 50)})
				continue
			}
			if (intersections.length > 1) {
				console.warn(`boxOrderer.orderBoxes(box: '${box.getName()}') intersections.length > 1`)
			}
			layer0Nodes.push({node: child, wishPosition: intersections[0]})
		} else {
			console.warn(`boxOrderer.orderBoxes(box: '${box.getName()}') does not contain end of ${link.describe()}`)
		}
	}

	const layer0 = new Layer(layer0Nodes)
	await Promise.all(layer0.getSuggestions().map(async (suggestion: Suggestion) => {
		if (suggestion.node instanceof Box) {
			await suggestion.node.updateMeasuresAndBorderingLinks({
				x: suggestion.suggestedPosition.percentX,
				y: suggestion.suggestedPosition.percentY,
				width: suggestion.suggestedSize?.width,
				height: suggestion.suggestedSize?.height
			})
			await suggestion.node.saveMapData()
		} else {
			await suggestion.node.setPositionAndRenderAndSave(suggestion.suggestedPosition)
		}
	}))
	await box.rearrangeBoxesWithoutMapData()
	console.log(`...ordered boxes in '${box.getName()}'`)

	function getEndThatIsInBox(link: Link): Box|NodeWidget|undefined {
		for (const child of childs) {
			if (link.from.isBoxInPath(child) || link.to.isBoxInPath(child)) {
				return child
			}
		}
	}
}

async function unorderBoxes(box: FolderBox): Promise<void> {
	console.log(`unorder boxes in '${box.getName()}'...`)
	const childs: (Box|NodeWidget)[] = box.getChilds()
	const spaces: LocalRect[] = new EmptySpaceFinder([]).findEmptySpaces(childs.length)
	await Promise.all(childs.map(async (child, index) => {
		if (child instanceof Box) {
			await Promise.all([
				child.updateMeasuresAndBorderingLinks({
					x: spaces[index].x,
					y: spaces[index].y
				}),
				child.saveMapData()
			])
		} else {
			await child.setPositionAndRenderAndSave(spaces[index].getMidPosition())
		}
	}))
	console.log(`...unordered boxes in '${box.getName()}'`)
}