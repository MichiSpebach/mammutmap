import { SourcelessBox } from '../dist/core/box/SourcelessBox'
import { LocalRect } from '../dist/core/LocalRect'
import { settings } from '../dist/core/settings/settings'
import { Box, contextMenu, FileBox, FolderBox, Link, LocalPosition, MenuItemFile, NodeWidget } from '../dist/pluginFacade'
import { Layer } from './boxOrderer/Layer'
import { Suggestion } from './boxOrderer/LayerSide'
import { NodeToOrder } from './boxOrderer/NodeToOrder'
import { EmptySpaceFinder } from '../dist/core/box/EmptySpaceFinder'
import { LinkEnd } from '../dist/core/link/LinkEnd'

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
	const children: (Box|NodeWidget)[] = [...box.getChilds()]
	const borderingLinks: Link[] = box.borderingLinks.getAll()

	const layer0Nodes: NodeToOrder[] = []
	const layer1Nodes: NodeToOrder[] = []
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
				if (child instanceof NodeWidget) {
					layer0Nodes.push({node: child, wishPosition: new LocalPosition(50, 50)})
				} else {
					layer1Nodes.push({node: child, wishPosition: new LocalPosition(50, 50)})
				}
				children.splice(children.indexOf(child), 1)
				continue
			}
			if (intersections.length > 1) {
				console.warn(`boxOrderer.orderBoxes(box: '${box.getName()}') intersections.length > 1`)
			}
			if (child instanceof NodeWidget) {
				layer0Nodes.push({node: child, wishPosition: intersections[0]})
			} else {
				layer1Nodes.push({node: child, wishPosition: intersections[0]})
			}
			children.splice(children.indexOf(child), 1)
		} else {
			console.warn(`boxOrderer.orderBoxes(box: '${box.getName()}') does not contain end of ${link.describe()}`)
		}
	}

	const connectedNodes = getNodesConnectedToLayerNodes(children, layer0Nodes)
	layer1Nodes.push(...connectedNodes)
	for (const connectedNode of connectedNodes) {
		children.splice(children.indexOf(connectedNode.node), 1)
	}

	const layer0 = new Layer(layer0Nodes, {toTop: 0, toRight: 0, toBottom: 0, toLeft: 0})
	await applySuggestions(layer0)

	const layer1 = new Layer(layer1Nodes, {toTop: 8, toRight: 8, toBottom: 8, toLeft: 8})
	await applySuggestions(layer1)

	let innermostLayer: Layer = layer1
	while (true) {
		const nodes: NodeToOrder[] = getNodesConnectedToLayerNodes(children, innermostLayer.nodes)
		if (nodes.length < 1) {
			break
		}
		for (const node of nodes) {
			children.splice(children.indexOf(node.node), 1)
		}
		const distances = innermostLayer.calculateInnerDistances()
		innermostLayer = new Layer(nodes, {
			toTop: distances.toTop + 4,
			toRight: distances.toRight + 4,
			toBottom: distances.toBottom + 4,
			toLeft: distances.toLeft + 4
		})
		await applySuggestions(innermostLayer)
	}

	if (children.length > 0) {
		const occupiedSpaces: LocalRect[] = box.getChilds().filter(child => !children.includes(child)).map(child => {
			if (child instanceof Box) {
				return child.getLocalRectToSave()
			} else {
				return new LocalRect(child.getSavePosition().percentX-4, child.getSavePosition().percentY-4, 8, 8)
			}
		})
		const emptySpaces: LocalRect[] = new EmptySpaceFinder(occupiedSpaces).findEmptySpaces(children.length)
		await Promise.all(children.filter(child => child.isMapDataFileExisting()).map(async (child, index) => {
			if (child instanceof Box) {
				await child.updateMeasuresAndBorderingLinks({
					x: emptySpaces[index].x,
					y: emptySpaces[index].y,
					width: emptySpaces[index].width < child.getLocalRectToSave().width ? emptySpaces[index].width : undefined,
					height: emptySpaces[index].height < child.getLocalRectToSave().height ? emptySpaces[index].height : undefined
				})
				await child.saveMapData()
			} else {
				await child.setPositionAndRenderAndSave(emptySpaces[index].getMidPosition())
			}
		}))
		await box.rearrangeBoxesWithoutMapData()
	}
	
	console.log(`...ordered boxes in '${box.getName()}'`)

	function getEndThatIsInBox(link: Link): Box|NodeWidget|undefined {
		for (const child of children) {
			if (link.from.isBoxInPath(child) || link.to.isBoxInPath(child)) {
				return child
			}
		}
	}
}

function getNodesConnectedToLayerNodes(nodes: (Box|NodeWidget)[], layerNodes: NodeToOrder[]): NodeToOrder[] {
	const connectedNodes: NodeToOrder[] = []
	for (const layerNode of layerNodes) {
		const borderingLinks = layerNode.node.borderingLinks.getAll()
		for (const borderingLink of borderingLinks) {
			const otherEnd: LinkEnd = borderingLink.from.getTargetNodeId() === layerNode.node.getId()
				? borderingLink.to
				: borderingLink.from
			for (const node of nodes) {
				if (otherEnd.isBoxInPath(node)) {
					connectedNodes.push({node: node, wishPosition: layerNode.wishPosition})
				}
			}
		}
	}
	return connectedNodes
}

async function applySuggestions(layer: Layer): Promise<void> {
	await Promise.all(layer.getSuggestions().map(async (suggestion: Suggestion) => {
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