import { AbstractNodeWidget } from '../dist/core/AbstractNodeWidget'
import { BoxLinks } from '../dist/core/box/BoxLinks'
import { NodeData } from '../dist/core/mapData/NodeData'
import { ClientPosition } from '../dist/core/shape/ClientPosition'
import { Box, BoxWatcher, FolderBox, Link, MenuItemFile, NodeWidget, WayPointData, contextMenu, coreUtil, renderManager } from '../dist/pluginFacade'
import * as pluginFacade from '../dist/pluginFacade'

contextMenu.addLinkMenuItem((link: Link) => new MenuItemFile({label: 'bundle', click: () => bundleLink(link)}))

const addBackup = BoxLinks.prototype.add
BoxLinks.prototype.add = async function (options) {
	const link: Link = await addBackup.call(this, options)
	//await bundleLink(link) TODO
	return link
}

async function bundleLink(link: Link): Promise<void> {
	const parallelRouteParts: {
		from: {node: AbstractNodeWidget, link: Link}
		to: {node: AbstractNodeWidget, link: Link}
		length: number
	}[] = []
	
	const deepestBoxInFromPath: BoxWatcher = (await findAndExtendParallelRouteParts(link, 'from', parallelRouteParts)).deepestBoxInPath
	const deepestBoxInToPath: BoxWatcher = (await findAndExtendParallelRouteParts(link, 'to', parallelRouteParts)).deepestBoxInPath
	
	let longestParallelRoutePart = parallelRouteParts[0]
	for (const parallelRoutePart of parallelRouteParts) {
		if (parallelRoutePart.length > longestParallelRoutePart.length) {
			longestParallelRoutePart = parallelRoutePart
		}
	}
	console.log(`longestParallelRoutePart: ${longestParallelRoutePart.from.link.getId()} ${longestParallelRoutePart.from.node.getId()} ${longestParallelRoutePart.length}`)
	
	if (longestParallelRoutePart.length > 0) {
		await bundleLinkIntoParallelRoutePart(link, longestParallelRoutePart)
	}

	await Promise.all([
		deepestBoxInFromPath.unwatch(),
		deepestBoxInToPath.unwatch()
	])
}

async function findAndExtendParallelRouteParts(
	link: Link,
	end: 'from'|'to',
	parallelRouteParts: {
		from: {node: AbstractNodeWidget, link: Link}
		to: {node: AbstractNodeWidget, link: Link}
		length: number
	}[]
): Promise<{deepestBoxInPath: BoxWatcher}> {
	const managingBox = link.getManagingBox()
	let path: WayPointData[] = link.getData()[end].path
	if (path[0].boxId === managingBox.getId()) {
		path = path.slice(1)
	}
	let child: {node: Box|NodeWidget, watcher: BoxWatcher} = {node: managingBox, watcher: await BoxWatcher.newAndWatch(managingBox)}
	for (const wayPoint of path) {
		if (!(child.node instanceof Box)) {
			console.warn(`bundleLink(link: ${link.describe()}): child.node is not instanceof Box, this should never happen`)
			break
		}
		const newChild: {node: Box|NodeWidget, watcher: BoxWatcher} | undefined = await child.node.findChildByIdAndRenderIfNecessary(wayPoint.boxId)
		if (!newChild) {
			console.warn(`bundleLink(link: ${link.describe()}): child not found for wayPoint with name '${wayPoint.boxName}'`)
			break
		}
		child.watcher.unwatch()
		child = newChild
		for (const outgoingNodeLink of child.node.borderingLinks.getOutgoing()) {
			if (outgoingNodeLink === link) {
				continue
			}
			const parallelRoutePart = parallelRouteParts.find(part => part[end].link.from.isBoxInPath(child!.node) || part[end].link.to.isBoxInPath(child!.node))
			if (parallelRoutePart) {
				console.log(`parallelRoutePart: ${parallelRoutePart[end].link.getId()} ${parallelRoutePart[end].node.getId()} ${parallelRoutePart.length}`)
				parallelRoutePart[end] = {link: outgoingNodeLink, node: child.node}
				parallelRoutePart.length++
			} else {
				parallelRouteParts.push({
					from: {link: outgoingNodeLink, node: child.node},
					to: {link: outgoingNodeLink, node: child.node},
					length: 0
				})
			}
		}
	}
	return {deepestBoxInPath: child.watcher}
}

async function bundleLinkIntoParallelRoutePart(link: Link, longestParallelRoutePart: {
	from: {node: AbstractNodeWidget, link: Link}
	to: {node: AbstractNodeWidget, link: Link}
}): Promise<void> {
	if (!(longestParallelRoutePart.from.node instanceof Box)) {
		console.warn(`longestParallelRoutePart.from.node is instanceof LinkNodeWidget, case not implemented yet`) // TODO: this can normally happen, this means from is equal and link that is bundled can be removed
		return
	}
	const otherFrom = await longestParallelRoutePart.from.link.getManagingBox().getDescendantByPathAndRenderIfNecessary(longestParallelRoutePart.from.link.getData().from.path.map(wayPoint => {
		return {id: wayPoint.boxId}
	}))

	let bundleFromLinkNode: NodeWidget
	let bundleLinkNodePosition: ClientPosition
	if (otherFrom.node instanceof NodeWidget && otherFrom.node.getParent() === longestParallelRoutePart.from.node) {
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
	await otherFrom.watcher.unwatch()
}
