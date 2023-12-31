import { AbstractNodeWidget } from '../dist/core/AbstractNodeWidget'
import { BoxLinks } from '../dist/core/box/BoxLinks'
import { LinkEnd } from '../dist/core/link/LinkEnd'
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
	const commonRouteParts: {
		from: {node: AbstractNodeWidget, link: Link}
		to: {node: AbstractNodeWidget, link: Link}
		length: number
	}[] = []
	
	const deepestBoxInFromPath: BoxWatcher = (await findAndExtendCommonRouteParts(link, 'from', commonRouteParts)).deepestBoxInPath
	const deepestBoxInToPath: BoxWatcher = (await findAndExtendCommonRouteParts(link, 'to', commonRouteParts)).deepestBoxInPath
	
	let longestCommonRoutePart = commonRouteParts[0]
	for (const commonRoutePart of commonRouteParts) {
		if (commonRoutePart.length > longestCommonRoutePart.length) {
			longestCommonRoutePart = commonRoutePart
		}
	}
	
	if (longestCommonRoutePart.length > 0) {
		await bundleLinkIntoCommonRoute(link, longestCommonRoutePart)
	}

	await Promise.all([
		deepestBoxInFromPath.unwatch(),
		deepestBoxInToPath.unwatch()
	])
}

async function findAndExtendCommonRouteParts(
	link: Link,
	end: 'from'|'to',
	commonRouteParts: {
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
	let waypoint: {node: Box|NodeWidget, watcher: BoxWatcher} = {node: managingBox, watcher: await BoxWatcher.newAndWatch(managingBox)}
	for (const waypointData of path) {
		if (!(waypoint.node instanceof Box)) {
			console.warn(`bundleLink(link: ${link.describe()}): waypoint.node is not instanceof Box, this should never happen`)
			break
		}
		const newWaypoint: {node: Box|NodeWidget, watcher: BoxWatcher} | undefined = await waypoint.node.findChildByIdAndRenderIfNecessary(waypointData.boxId)
		if (!newWaypoint) {
			console.warn(`bundleLink(link: ${link.describe()}): nodeWidget not found for waypointData with name '${waypointData.boxName}'`)
			break
		}
		waypoint.watcher.unwatch()
		waypoint = newWaypoint
		const borderingLinks: Link[] = end === 'from'
			? waypoint.node.borderingLinks.getOutgoing()
			: waypoint.node.borderingLinks.getIngoing()
		for (const borderingLink of borderingLinks) {
			if (borderingLink === link) {
				continue
			}
			const commonRoutePart = commonRouteParts.find(part => part[end].link.from.isBoxInPath(waypoint.node) || part[end].link.to.isBoxInPath(waypoint.node))
			if (commonRoutePart) {
				commonRoutePart[end] = {link: borderingLink, node: waypoint.node}
				commonRoutePart.length++
			} else {
				commonRouteParts.push({
					from: {link: borderingLink, node: waypoint.node},
					to: {link: borderingLink, node: waypoint.node},
					length: 0
				})
			}
		}
	}
	return {deepestBoxInPath: waypoint.watcher}
}

async function bundleLinkIntoCommonRoute(link: Link, commonRoute: {
	from: {node: AbstractNodeWidget, link: Link}
	to: {node: AbstractNodeWidget, link: Link}
}): Promise<void> {
	const bundleFromPart: boolean = link.getData().from.path.at(-1)?.boxId !== commonRoute.from.link.getData().from.path.at(-1)?.boxId
	const bundleToPart: boolean = link.getData().to.path.at(-1)?.boxId !== commonRoute.to.link.getData().to.path.at(-1)?.boxId
	let fromLink: Link = link
	let toLink: Link = link
	if (bundleFromPart && bundleToPart) {
		toLink = await link.getManagingBoxLinks().addCopy(link)
	}
	if (bundleFromPart) {
		await bundleLinkEndIntoCommonRoutePart(fromLink.to, 'from', commonRoute.from)
	}
	if (bundleToPart) {
		await bundleLinkEndIntoCommonRoutePart(toLink.from, 'to', commonRoute.to)
	}
	if (!bundleFromPart && !bundleToPart) {
		console.warn(`linkBundler.bundleLinkIntoCommonRoute(link: ${link.describe()}, ..) detected duplicate link`)
	}
}

async function bundleLinkEndIntoCommonRoutePart(linkEnd: LinkEnd, end: 'from'|'to', commonRoutePart: {node: AbstractNodeWidget, link: Link}): Promise<void> {
	if (!(commonRoutePart.node instanceof Box)) {
		console.warn(`commonRoutePart.node is instanceof LinkNodeWidget, case not implemented yet`) // TODO: this can normally happen, this means from is equal and link that is bundled can be removed
		return
	}
	const commonRouteEnd = await getLinkEndNode(commonRoutePart.link, end)

	let bundleFromLinkNode: NodeWidget
	if (commonRouteEnd.node instanceof NodeWidget && commonRouteEnd.node.getParent() === commonRoutePart.node) {
		bundleFromLinkNode = commonRouteEnd.node
	} else {
		bundleFromLinkNode = await insertNodeIntoCommonRoutePart(end, {node: commonRoutePart.node, link: commonRoutePart.link})
	}
	let bundleLinkNodePosition: ClientPosition = (await bundleFromLinkNode.getClientShape()).getMidPosition()
	await linkEnd.dragAndDrop({dropTarget: bundleFromLinkNode, clientPosition: bundleLinkNodePosition})
	await commonRouteEnd.watcher.unwatch()
}

/** TODO move this into Link */
async function insertNodeIntoCommonRoutePart(end: 'from'|'to', commonRoutePart: {node: Box, link: Link}): Promise<NodeWidget> {
	const newLinkNodeId = coreUtil.generateId()
	await commonRoutePart.node.nodes.add(new NodeData(newLinkNodeId, 50, 50)) // TODO: calculate average intersection position with node
	const insertedNode: NodeWidget = commonRoutePart.node.nodes.getNodeById(newLinkNodeId)! // TODO: make BoxNodesWidget::add(..) return added LinkNodeWidget
	const insertedNodePosition: ClientPosition = (await insertedNode.getClientShape()).getMidPosition()
	const newLink: Link = await commonRoutePart.link.getManagingBoxLinks().addCopy(commonRoutePart.link)
	await newLink[end === 'from' ? 'to' : 'from'].dragAndDrop({dropTarget: insertedNode, clientPosition: insertedNodePosition})
	await commonRoutePart.link[end].dragAndDrop({dropTarget: insertedNode, clientPosition: insertedNodePosition})
	return insertedNode
}

async function getLinkEndNode(link: Link, end: 'from'|'to'): Promise<{
	node: Box | NodeWidget;
	watcher: BoxWatcher;
}> {
	return link.getManagingBox().getDescendantByPathAndRenderIfNecessary(link.getData()[end].path.map(wayPoint => {
		return {id: wayPoint.boxId}
	}))
}