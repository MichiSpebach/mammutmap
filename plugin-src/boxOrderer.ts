import { SourcelessBox } from '../dist/core/box/SourcelessBox'
import { LocalRect } from '../dist/core/LocalRect'
import { settings } from '../dist/core/settings/settings'
import { Box, contextMenu, FileBox, FolderBox, Link, LocalPosition, MenuItemFile, NodeWidget } from '../dist/pluginFacade'
import { Layer } from './boxOrderer/Layer'
import { LayerSide, Suggestion } from './boxOrderer/LayerSide'
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

	const borderLayerNodes: NodeToOrder[] = []
	const layerNodes: NodeToOrder[] = []
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
					borderLayerNodes.push({node: child, wishPosition: new LocalPosition(50, 50)})
				} else {
					layerNodes.push({node: child, wishPosition: new LocalPosition(50, 50)})
				}
				children.splice(children.indexOf(child), 1)
				continue
			}
			if (intersections.length > 1) {
				console.warn(`boxOrderer.orderBoxes(box: '${box.getName()}') intersections.length > 1`)
			}
			if (child instanceof NodeWidget) {
				borderLayerNodes.push({node: child, wishPosition: intersections[0]})
			} else {
				layerNodes.push({node: child, wishPosition: intersections[0]})
			}
			children.splice(children.indexOf(child), 1)
		} else {
			console.warn(`boxOrderer.orderBoxes(box: '${box.getName()}') does not contain end of ${link.describe()}`)
		}
	}

	const connectedNodes = getNodesConnectedToLayerNodes(children, borderLayerNodes)
	layerNodes.push(...connectedNodes)
	for (const connectedNode of connectedNodes) {
		children.splice(children.indexOf(connectedNode.node), 1)
	}

	await applySuggestions(new Layer(borderLayerNodes, {toTop: 0, toRight: 0, toBottom: 0, toLeft: 0}))
	const layers: Layer[] = [
		new Layer(layerNodes, {toTop: 8, toRight: 8, toBottom: 8, toLeft: 8})
	]
	await applySuggestions(layers[0])

	let innermostLayer: Layer = layers[0]
	let distances = layers[0].getInnerDistances()
	while (true) {
		const nodes: NodeToOrder[] = getNodesConnectedToLayerNodes(children, innermostLayer.nodes)
		if (nodes.length < 1) {
			break
		}
		for (const node of nodes) {
			children.splice(children.indexOf(node.node), 1)
		}
		innermostLayer = new Layer(nodes, {
			toTop: distances.toTop,
			toRight: distances.toRight,
			toBottom: distances.toBottom,
			toLeft: distances.toLeft
		})
		distances = innermostLayer.getInnerDistances()
		layers.push(innermostLayer)
		if (scaleLayers(layers).scaled) {
			await Promise.all(layers.map(applySuggestions))
		} else {
			await applySuggestions(innermostLayer)
		}
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
	const connectedNodes: {node: Box|NodeWidget, wishPositions: LocalPosition[]}[] = []
	for (const layerNode of layerNodes) {
		const borderingLinks = layerNode.node.borderingLinks.getAll()
		for (const borderingLink of borderingLinks) {
			const otherEnd: LinkEnd = borderingLink.from.getTargetNodeId() === layerNode.node.getId()
				? borderingLink.to
				: borderingLink.from
			for (const node of nodes) {
				if (otherEnd.isBoxInPath(node)) {
					const connectedNode = connectedNodes.find(nodeToOrder => nodeToOrder.node === node)
					if (connectedNode) {
						connectedNode.wishPositions.push(layerNode.wishPosition/*TODO: calculateLinkEndPositionInBox(..)*/)
					} else {
						connectedNodes.push({node: node, wishPositions: [layerNode.wishPosition/*TODO: calculateLinkEndPositionInBox(..)*/]})
					}
				}
			}
		}
	}
	return connectedNodes.map(connectedNode => ({node: connectedNode.node, wishPosition: calculateAvaragePosition(connectedNode.wishPositions)}))
}

async function calculateLinkEndPositionInBox(box: Box, linkEnd: LinkEnd): Promise<LocalPosition> {
	if (box === linkEnd.getManagingBox()) {
		return await linkEnd.getTargetPositionInManagingBoxCoords()
	}
	return box.transform.outerCoordsRecursiveToLocal(linkEnd.getManagingBox(), await linkEnd.getTargetPositionInManagingBoxCoords())
}

function calculateAvaragePosition(positions: LocalPosition[]): LocalPosition {
	let x = 0
	let y = 0
	for (const position of positions) {
		x += position.percentX
		y += position.percentY
	}
	return new LocalPosition(x/positions.length, y/positions.length)
}

function scaleLayers(layers: Layer[]): {scaled: boolean} {
	let wishedWidth: number = 0
	let wishedHeight: number = 0
	for (const layer of layers) {
		wishedWidth += layer.left.calculateThickness()
		wishedWidth += layer.right.calculateThickness()
		wishedHeight += layer.top.calculateThickness()
		wishedHeight += layer.bottom.calculateThickness()
	}
	let toTop: number = layers[0].top.distanceToSide
	let toLeft: number = layers[0].left.distanceToSide
	let toRight: number = layers[0].right.distanceToSide
	let toBottom: number = layers[0].bottom.distanceToSide
	const availableWidth: number = 100-toLeft-toRight
	const availableHeight: number = 100-toTop-toBottom
	if (wishedWidth >= availableWidth && wishedHeight >= availableHeight) {
		return {scaled: false}
	}
	
	let newMaxHorizontalThickness: number = 100
	if (wishedWidth < availableWidth) {
		const effectiveHorizontalLayerSides: LayerSide[] = layers.map(layer => getEffectiveLayerSides(layer, 'horizontal')).flat()
		newMaxHorizontalThickness = availableWidth / effectiveHorizontalLayerSides.length
	}
	let newMaxVerticalThickness: number = 100
	if (wishedWidth < availableWidth) {
		const effectiveVerticalLayerSides: LayerSide[] = layers.map(layer => getEffectiveLayerSides(layer, 'vertical')).flat()
		newMaxVerticalThickness = availableWidth / effectiveVerticalLayerSides.length
	}

	for (const layer of layers) {
		let innerToTop: number = toTop + Math.min(layer.top.getWishedSpace().orthogonalToSide, newMaxVerticalThickness)
		let innerToRight: number = toRight + Math.min(layer.right.getWishedSpace().orthogonalToSide, newMaxHorizontalThickness)
		let innerToBottom: number = toBottom + Math.min(layer.bottom.getWishedSpace().orthogonalToSide, newMaxVerticalThickness)
		let innerToLeft: number = toLeft + Math.min(layer.left.getWishedSpace().orthogonalToSide, newMaxHorizontalThickness)
		layer.setDistances({
			toTop, innerToTop,
			toRight, innerToRight,
			toBottom, innerToBottom,
			toLeft, innerToLeft
		})
		toTop = innerToTop
		toRight = innerToRight
		toBottom = innerToBottom
		toLeft = innerToLeft
	}

	return {scaled: true}

	function getEffectiveLayerSides(layer: Layer, direction: 'horizontal'|'vertical'): LayerSide[] {
		const effectiveLayerSides: LayerSide[] = []
		if (direction === 'horizontal') {
			if (layer.left.nodes.length > 0) {
				effectiveLayerSides.push(layer.left)
			}
			if (layer.right.nodes.length > 0) {
				effectiveLayerSides.push(layer.right)
			}
		} else {
			if (layer.top.nodes.length > 0) {
				effectiveLayerSides.push(layer.top)
			}
			if (layer.bottom.nodes.length > 0) {
				effectiveLayerSides.push(layer.bottom)
			}
		}
		return effectiveLayerSides
	}
}

async function applySuggestions(layer: Layer): Promise<void> {
	await Promise.all(layer.getSuggestions().map(async (suggestion: Suggestion) => {
		if (suggestion.node instanceof Box) {
			if (((suggestion.suggestedSize?.width??1) <= 0) || ((suggestion.suggestedSize?.height??1) <= 0)) {
				console.log(suggestion.node.getName())
				console.log(JSON.stringify(suggestion.suggestedPosition))
				console.log(JSON.stringify(suggestion.suggestedSize))
			}
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