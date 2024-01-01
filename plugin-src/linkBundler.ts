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
	const commonRoutes: {
		from: {node: AbstractNodeWidget, link: Link}
		to: {node: AbstractNodeWidget, link: Link}
		length: number
	}[] = []

	const deepestBoxInFromPath: BoxWatcher = (await findAndExtendCommonRoutes(link, 'from', commonRoutes)).deepestBoxInPath
	const deepestBoxInToPath: BoxWatcher = (await findAndExtendCommonRoutes(link, 'to', commonRoutes)).deepestBoxInPath

	let longestCommonRoute = commonRoutes[0]
	for (const commonRoute of commonRoutes) {
		if (commonRoute.length > longestCommonRoute.length) {
			longestCommonRoute = commonRoute
		}
	}

	if (longestCommonRoute.length > 0) {
		await bundleLinkIntoCommonRoute(link, longestCommonRoute)
	}

	await Promise.all([
		deepestBoxInFromPath.unwatch(),
		deepestBoxInToPath.unwatch()
	])
}

async function findAndExtendCommonRoutes(
	link: Link,
	end: 'from'|'to',
	commonRoutes: {
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
			const commonRoute = commonRoutes.find(commonRoute => commonRoute[end].link.from.isBoxInPath(waypoint.node) || commonRoute[end].link.to.isBoxInPath(waypoint.node))
			if (commonRoute) {
				commonRoute[end] = {link: borderingLink, node: waypoint.node}
				commonRoute.length++
			} else {
				commonRoutes.push({
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
		const linkManagingBoxBefore: Box = commonRoutePart.link.getManagingBox()
		bundleFromLinkNode = (await commonRoutePart.link.getManagingBoxLinks().insertNodeIntoLink(
			commonRoutePart.link,
			commonRoutePart.node,
			(await commonRoutePart.node.getClientRect()).getMidPosition() // TODO: calculate average intersection position with node
		)).insertedNode
		if (linkManagingBoxBefore !== commonRoutePart.link.getManagingBox()) {
			console.warn(`linkBundler.bundleLinkEndIntoCommonRoutePart(..) did not expect BoxLinks::insertNodeIntoLink(link, ..) to change managingBox of link`)
		}
	}
	let bundleLinkNodePosition: ClientPosition = (await bundleFromLinkNode.getClientShape()).getMidPosition()
	await linkEnd.dragAndDrop({dropTarget: bundleFromLinkNode, clientPosition: bundleLinkNodePosition})
	await commonRouteEnd.watcher.unwatch()
}

async function getLinkEndNode(link: Link, end: 'from'|'to'): Promise<{
	node: Box | NodeWidget;
	watcher: BoxWatcher;
}> {
	return link.getManagingBox().getDescendantByPathAndRenderIfNecessary(link.getData()[end].path.map(wayPoint => {
		return {id: wayPoint.boxId}
	}))
}
