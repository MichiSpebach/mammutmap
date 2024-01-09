import { AbstractNodeWidget } from '../dist/core/AbstractNodeWidget'
import { ClientRect } from '../dist/core/ClientRect'
import { BoxLinks } from '../dist/core/box/BoxLinks'
import { LinkEnd } from '../dist/core/link/LinkEnd'
import { ClientPosition } from '../dist/core/shape/ClientPosition'
import { Box } from '../dist/core/box/Box'
import { BoxWatcher } from '../dist/core/box/BoxWatcher'
import { Link } from '../dist/core/link/Link'
import { WayPointData } from '../dist/core/mapData/WayPointData'
import { NodeWidget } from '../dist/core/node/NodeWidget'
import * as contextMenu from '../dist/core/contextMenu'
import { applicationMenu } from '../dist/core/applicationMenu/applicationMenu'
import { MenuItemFile } from '../dist/core/applicationMenu/MenuItemFile'
/**
 * pluginFacade not used in imports because
 * some imports could not be resolved when importing from '../dist/pluginFacade' and cause:
 * "TypeError: Class extends value undefined is not a constructor or null"
 * TODO fix this!
 */

contextMenu.addLinkMenuItem((link: Link) => new MenuItemFile({label: 'bundle', click: () => bundleLink(link)}))

let bundleNewLinksActivated: boolean = false
let addLinkBackup: ((options: any) => Promise<Link>) = BoxLinks.prototype.add

const activateBundleNewLinksItem = new MenuItemFile({label: 'activate bundle new links', enabled: !bundleNewLinksActivated, click() {
	applicationMenu.setMenuItemEnabled(activateBundleNewLinksItem, false)
	applicationMenu.setMenuItemEnabled(deactivateBundleNewLinksItem, true)
	activateBundleNewLinks()
}})
const deactivateBundleNewLinksItem = new MenuItemFile({label: 'deactivate bundle new links', enabled: bundleNewLinksActivated, click() {
	applicationMenu.setMenuItemEnabled(activateBundleNewLinksItem, true)
	applicationMenu.setMenuItemEnabled(deactivateBundleNewLinksItem, false)
	deactivateBundleNewLinks()
}})

// ?. because applicationMenu is not initialized for unit tests
applicationMenu?.addMenuItemTo('linkBundler.js', activateBundleNewLinksItem)
applicationMenu?.addMenuItemTo('linkBundler.js', deactivateBundleNewLinksItem)

function activateBundleNewLinks(): void {
	if (bundleNewLinksActivated) {
		console.warn(`bundleNewLinks is already activated`)
		return
	}
	bundleNewLinksActivated = true
	addLinkBackup = BoxLinks.prototype.add
	BoxLinks.prototype.add = async function (options) {
		const link: Link = await addLinkBackup.call(this, options)
		await bundleLink(link)
		return link
	}
	console.info(`bundleNewLinks activated`)
}

function deactivateBundleNewLinks(): void {
	if (!bundleNewLinksActivated) {
		console.warn(`bundleNewLinks is already deactivated`)
		return
	}
	bundleNewLinksActivated = false
	BoxLinks.prototype.add = addLinkBackup
	console.info(`bundleNewLinks deactivated`)
}


/** exported for unit tests */
export async function bundleLink(link: Link): Promise<void> {
	const commonRoutes: {
		from: {node: AbstractNodeWidget, link: Link}
		to: {node: AbstractNodeWidget, link: Link}
		length: number
	}[] = []

	const deepestBoxInFromPath: BoxWatcher = (await findAndExtendCommonRoutes(link, 'from', commonRoutes)).deepestBoxInPath
	const deepestBoxInToPath: BoxWatcher = (await findAndExtendCommonRoutes(link, 'to', commonRoutes)).deepestBoxInPath

	const longestCommonRoute = getLongestCommonRoute(commonRoutes)
	if (longestCommonRoute && longestCommonRoute.length > 0) {
		await bundleLinkIntoCommonRoute(link, longestCommonRoute)
	}

	await Promise.all([
		deepestBoxInFromPath.unwatch(),
		deepestBoxInToPath.unwatch()
	])
}

/** exported for unit tests */
export async function findAndExtendCommonRoutes(
	link: Link,
	end: 'from'|'to',
	commonRoutes: {
		from: {node: AbstractNodeWidget, link: Link}
		to: {node: AbstractNodeWidget, link: Link}
		length: number
	}[]
): Promise<{deepestBoxInPath: BoxWatcher}> {
	// TODO: refactor this method
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
			const commonRoute = commonRoutes.find(commonRoute => {
				if (commonRoute[end].link !== borderingLink) {
					return false
				}
				const from: LinkEnd = commonRoute[end].link.from
				const to: LinkEnd = commonRoute[end].link.to
				return from.getManagingBox() === waypoint.node.getParent()
					|| to.getManagingBox() === waypoint.node.getParent()
					|| from.isBoxInPath(waypoint.node)
					|| to.isBoxInPath(waypoint.node)
			})
			if (commonRoute) {
				commonRoutes.push({
					...commonRoute,
					[end]: {link: borderingLink, node: waypoint.node},
					length: commonRoute.length + 1
				})
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

/** exported for unit tests */
export function getLongestCommonRoute(commonRoutes: {
	from: {node: AbstractNodeWidget, link: Link}
	to: {node: AbstractNodeWidget, link: Link}
	length: number
}[]): {
	from: {node: AbstractNodeWidget, link: Link}
	to: {node: AbstractNodeWidget, link: Link}
	length: number
} | undefined {
	if (commonRoutes.length < 1) {
		return undefined
	}

	let longestCommonRoute = commonRoutes[0]
	for (const commonRoute of commonRoutes) {
		if (commonRoute.length > longestCommonRoute.length) {
			longestCommonRoute = commonRoute
		}
	}
	return longestCommonRoute
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
		if (link.to.isBoxInPath(commonRoute.to.node)) {
			toLink = await link.getManagingBoxLinks().addCopy(link)
		} else if (link.from.isBoxInPath(commonRoute.from.node)) {
			fromLink = await link.getManagingBoxLinks().addCopy(link)
		} else {
			console.warn(`linkBundler.bundleLinkIntoCommonRoute(link: ${link.describe()}, ..) failed to decide weather commonRoute.from or commonRoute.to is heavier`)
			return
		}
	}
	if (bundleFromPart) {
		const insertion = await bundleLinkEndIntoCommonRoutePart(fromLink.to, 'from', commonRoute.from)
		if (insertion && insertion.addedLink.getData().from.path.at(-1)?.boxId === insertion.insertedNode.getId()) {
			commonRoute.to.link = insertion.addedLink
		}
	}
	if (bundleToPart) {
		await bundleLinkEndIntoCommonRoutePart(toLink.from, 'to', commonRoute.to)
	}
	if (!bundleFromPart && !bundleToPart) {
		console.warn(`linkBundler.bundleLinkIntoCommonRoute(link: ${link.describe()}, ..) detected duplicate link`)
	}
}

async function bundleLinkEndIntoCommonRoutePart(linkEnd: LinkEnd, end: 'from'|'to', commonRoutePart: {node: AbstractNodeWidget, link: Link}): Promise<{
	insertedNode: NodeWidget, addedLink: Link
} | undefined> {
	if (!(commonRoutePart.node instanceof Box)) {
		console.warn(`commonRoutePart.node is instanceof LinkNodeWidget, case not implemented yet`) // TODO: this can normally happen, this means from is equal and link that is bundled can be removed
		return
	}
	const commonRouteEnd = await getLinkEndNode(commonRoutePart.link, end)

	let insertion: {insertedNode: NodeWidget, addedLink: Link} | undefined
	let bundleFromLinkNode: NodeWidget
	if (commonRouteEnd.node instanceof NodeWidget && commonRouteEnd.node.getParent() === commonRoutePart.node) {
		bundleFromLinkNode = commonRouteEnd.node
	} else {
		const linkManagingBoxBefore: Box = commonRoutePart.link.getManagingBox()
		
		insertion = (await commonRoutePart.link.getManagingBoxLinks().insertNodeIntoLink(
			commonRoutePart.link,
			commonRoutePart.node,
			await calculateBundleNodePosition(linkEnd, {node: commonRoutePart.node, link: commonRoutePart.link})
		))
		bundleFromLinkNode = insertion.insertedNode
		if (linkManagingBoxBefore !== commonRoutePart.link.getManagingBox()) {
			console.warn(`linkBundler.bundleLinkEndIntoCommonRoutePart(..) did not expect BoxLinks::insertNodeIntoLink(link, ..) to change managingBox of link`)
		}
	}
	let bundleLinkNodePosition: ClientPosition = (await bundleFromLinkNode.getClientShape()).getMidPosition()
	await linkEnd.dragAndDrop({dropTarget: bundleFromLinkNode, clientPosition: bundleLinkNodePosition}) // TODO: do this with LocalPositions because ClientPositions may not work well when zoomed far away
	await commonRouteEnd.watcher.unwatch()
	return insertion
}

async function calculateBundleNodePosition(linkEnd: LinkEnd, commonRoutePart: {node: Box, link: Link}): Promise<ClientPosition> {
	const commonRouteLine: {from: ClientPosition, to: ClientPosition} = await commonRoutePart.link.getLineInClientCoords()
	const linkToBundleLine: {from: ClientPosition, to: ClientPosition} = await linkEnd.getReferenceLink().getLineInClientCoords()
	const averageLine = { // TODO: include weights
		from: new ClientPosition((commonRouteLine.from.x+linkToBundleLine.from.x) / 2, (commonRouteLine.from.y+linkToBundleLine.from.y) / 2),
		to: new ClientPosition((commonRouteLine.to.x+linkToBundleLine.to.x) / 2, (commonRouteLine.to.y+linkToBundleLine.to.y) / 2)
	}
	const nodeRect: ClientRect = await commonRoutePart.node.getClientRect()

	const intersections: ClientPosition[] = nodeRect.calculateIntersectionsWithLine(averageLine)
	if (intersections.length !== 1) {
		console.warn(`linkBundler.bundleLinkEndIntoCommonRoutePart(..) expected exactly one intersection but are ${intersections.length}`)
	}
	return intersections.at(0) ?? (await commonRoutePart.node.getClientRect()).getMidPosition()
}

async function getLinkEndNode(link: Link, end: 'from'|'to'): Promise<{
	node: Box | NodeWidget;
	watcher: BoxWatcher;
}> {
	const linkEndPath: WayPointData[] = link.getData()[end].path
	if (linkEndPath.length === 1 && linkEndPath[0].boxId === link.getManagingBox().getId()) {
		return {node: link.getManagingBox(), watcher: await BoxWatcher.newAndWatch(link.getManagingBox())}
	}
	return link.getManagingBox().getDescendantByPathAndRenderIfNecessary(linkEndPath.map(wayPoint => {
		return {id: wayPoint.boxId}
	}))
}
