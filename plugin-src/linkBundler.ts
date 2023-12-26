import { AbstractNodeWidget } from '../dist/core/AbstractNodeWidget'
import { BoxLinks } from '../dist/core/box/BoxLinks'
import { NodeData } from '../dist/core/mapData/NodeData'
import { ClientPosition } from '../dist/core/shape/ClientPosition'
import { Box, FolderBox, Link, MenuItemFile, NodeWidget, WayPointData, contextMenu, coreUtil, renderManager } from '../dist/pluginFacade'
import * as pluginFacade from '../dist/pluginFacade'

contextMenu.addLinkMenuItem((link: Link) => new MenuItemFile({label: 'bundle', click: () => bundleLink(link)}))

const addBackup = BoxLinks.prototype.add
BoxLinks.prototype.add = async function (options) {
	const link: Link = await addBackup.call(this, options)
	//await bundleLink(link) TODO
	return link
}

async function bundleLink(link: Link): Promise<void> {
	console.log('bundling')
	const referenceBox = link.getManagingBox()
	if (!(referenceBox instanceof FolderBox)) {
		console.warn(`linkBundler can not bundle links which managingBox is instanceof '${referenceBox?.constructor?.name}'`)
		return
	}

	const parallelRoutes: {
		fromInsertionPoint: {link?: Link, node?: AbstractNodeWidget}
		toInsertionPoint: {link?: Link, node?: AbstractNodeWidget}
		commonFromPath: {nodeId: string}[]
		commonToPath: {nodeId: string}[]
	}[] = []
	const parallelRouteParts: {
		from: {node: AbstractNodeWidget, link: Link} // TODO: node is always a Box?
		to: {node: AbstractNodeWidget, link: Link} // TODO: node is always a Box?
		length: number
	}[] = []
	const fromPath: WayPointData[] = getNormalizedPath(link.getData().from.path)
	const toPath: WayPointData[] = getNormalizedPath(link.getData().to.path)
	
	let node: Box|NodeWidget|undefined = referenceBox
	for (const wayPoint of fromPath) {
		node = node.findChildById(wayPoint.boxId)
		if (!node) {
			console.warn(`bundleLink(link: ${link.describe}): node not found for wayPoint with name '${wayPoint.boxName}'`)
			break
		}
		if (node instanceof NodeWidget) {
			break
		}
		for (const outgoingNodeLink of node.borderingLinks.getOutgoing()) {
			if (outgoingNodeLink === link) {
				continue
			}
			const parallelRoutePart = parallelRouteParts.find(part => part.from.link.from.isBoxInPath(node!) || part.from.link.to.isBoxInPath(node!))
			if (parallelRoutePart) {
				console.log(`parallelRoutePart: ${parallelRoutePart.from.link.getId()} ${parallelRoutePart.from.node.getId()} ${parallelRoutePart.length}`)
				parallelRoutePart.from = {link: outgoingNodeLink, node}
				parallelRoutePart.length++
			} else {
				parallelRouteParts.push({
					from: {link: outgoingNodeLink, node},
					to: {link: outgoingNodeLink, node},
					length: 0
				})
			}
		}
	}

	let longestParallelRoutePart = parallelRouteParts[0]
	for (const parallelRoutePart of parallelRouteParts) {
		if (parallelRoutePart.length > longestParallelRoutePart.length) {
			longestParallelRoutePart = parallelRoutePart
		}
	}
	console.log(`longestParallelRoutePart: ${longestParallelRoutePart.from.link.getId()} ${longestParallelRoutePart.from.node.getId()} ${longestParallelRoutePart.length}`)

	if (longestParallelRoutePart.length < 1) {
		return
	}
	if (!(longestParallelRoutePart.from.node instanceof Box)) {
		console.warn(`longestParallelRoutePart.from.node is instanceof LinkNodeWidget`) // TODO: this can normally happen, this means from is equal and link that is bundled can be removed
		return
	}
	const otherFrom = await longestParallelRoutePart.from.link.getManagingBox().getDescendantByPathAndRenderIfNecessary(longestParallelRoutePart.from.link.getData().from.path.map(wayPoint => {
		return {id: wayPoint.boxId}
	}))

	let bundleFromLinkNode: NodeWidget
	let bundleLinkNodePosition: ClientPosition
	if (otherFrom.node instanceof NodeWidget) {
		bundleFromLinkNode = otherFrom.node
		bundleLinkNodePosition = (await bundleFromLinkNode.getClientShape()).getMidPosition()
	} else {
		const newLinkNodeId = coreUtil.generateId()
		await longestParallelRoutePart.from.node.nodes.add(new NodeData(newLinkNodeId, 50, 50)) // TODO: calculate average intersection position with node
		bundleFromLinkNode = longestParallelRoutePart.from.node.nodes.getNodeById(newLinkNodeId)! // TODO: make BoxNodesWidget::add(..) return added LinkNodeWidget
		bundleLinkNodePosition = (await bundleFromLinkNode.getClientShape()).getMidPosition()
		await longestParallelRoutePart.from.node.links.add({from: otherFrom.node, to: bundleFromLinkNode, save: true})
		await longestParallelRoutePart.from.link.from.dragAndDrop({dropTarget: bundleFromLinkNode, clientPosition: bundleLinkNodePosition})
	}
	await link.to.dragAndDrop({dropTarget: bundleFromLinkNode, clientPosition: bundleLinkNodePosition})

	function getNormalizedPath(path: WayPointData[]) {
		if (path[0].boxId === referenceBox.getId()) {
			return path.slice(1)
		}
		return path
	}
}

function getCommonStart(path: readonly WayPointData[], otherPath: readonly WayPointData[]): {id: string}[] {
	const commonStart: {id: string}[] = []
	for (let i = 0; i < path.length && i < otherPath.length; i++) {
		if (path[i].boxId !== otherPath[i].boxId) {
			break
		}
		commonStart.push({id: path[i].boxId})
	}
	return commonStart
}