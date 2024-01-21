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
	const {route: longestCommonRoute, deepestBoxInFromPath, deepestBoxInToPath} = await findLongestCommonRouteWithWatchers(link)

	if (longestCommonRoute && longestCommonRoute.length > 0) {
		console.log(`bundle ${link.describe()} between ${longestCommonRoute.from.getName()} and ${longestCommonRoute.to.getName()}.`)
		await bundleLinkIntoCommonRoute(link, longestCommonRoute)
	}

	await Promise.all([
		deepestBoxInFromPath.unwatch(),
		deepestBoxInToPath.unwatch()
	])
}

/** exported for unit tests */
export async function findLongestCommonRoute(link: Link): Promise<{
	links: Link[]
	from: AbstractNodeWidget
	to: AbstractNodeWidget
	length: number
} | undefined> {
	const {route, deepestBoxInFromPath, deepestBoxInToPath} = await findLongestCommonRouteWithWatchers(link)

	await Promise.all([
		deepestBoxInFromPath.unwatch(),
		deepestBoxInToPath.unwatch()
	])

	return route
}

async function findLongestCommonRouteWithWatchers(link: Link): Promise<{
	route: {
		links: Link[]
		from: AbstractNodeWidget
		to: AbstractNodeWidget
		length: number
	}|undefined
	deepestBoxInFromPath: BoxWatcher
	deepestBoxInToPath: BoxWatcher
}> {
	const commonRoutes: {
		links: Link[]
		from: AbstractNodeWidget
		to: AbstractNodeWidget
		length: number
	}[] = []
	const deepestBoxInFromPath: BoxWatcher = (await findAndExtendCommonRoutes(link, 'from', commonRoutes)).deepestBoxInPath
	const deepestBoxInToPath: BoxWatcher = (await findAndExtendCommonRoutes(link, 'to', commonRoutes)).deepestBoxInPath

	let longestCommonRoute = commonRoutes.at(0)
	for (const commonRoute of commonRoutes) {
		if (commonRoute.length > longestCommonRoute!.length) {
			longestCommonRoute = commonRoute
		}
	}

	return {
		route: longestCommonRoute,
		deepestBoxInFromPath,
		deepestBoxInToPath
	}
}

async function findAndExtendCommonRoutes(
	link: Link,
	end: 'from'|'to',
	commonRoutes: {
		links: Link[]
		from: AbstractNodeWidget
		to: AbstractNodeWidget
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
			console.warn(`linkBundler.findAndExtendCommonRoutes(link: ${link.describe()}): waypoint.node is not instanceof Box, this should never happen`)
			break
		}
		const newWaypoint: {node: Box|NodeWidget, watcher: BoxWatcher} | undefined = await waypoint.node.findChildByIdAndRenderIfNecessary(waypointData.boxId)
		if (!newWaypoint) {
			console.warn(`linkBundler.findAndExtendCommonRoutes(link: ${link.describe()}): nodeWidget not found for waypointData with name '${waypointData.boxName}'`)
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
			let newWaypointNode: Box|NodeWidget = waypoint.node
			let commonRoute = commonRoutes.find(commonRoute => {
				const waypointInBorderingLink: boolean = borderingLink.from.isBoxInPath(waypoint.node) || borderingLink.to.isBoxInPath(waypoint.node)
				if (!waypointInBorderingLink) {
					return false
				}
				const commonRouteEndLink: Link|undefined = end === 'from'
					? commonRoute.links.at(0)
					: commonRoute.links.at(-1)
				if (!commonRouteEndLink) {
					console.warn(`linkBundler.findAndExtendCommonRoutes(link: ${link.describe()}): commonRoute.links is empty`)
					return false
				}
				const commonLinkContinues: boolean = commonRouteEndLink === borderingLink
				if (commonLinkContinues) {
					return true
				}
				const commonRouteEndNode: AbstractNodeWidget = commonRoute[end]
				if (commonRouteEndNode instanceof Box) {
					return isKnotBetweenLinks(commonRouteEndLink, borderingLink, commonRouteEndNode)
				}
				return false
			})
			if (!commonRoute) {
				commonRoute = {
					links: [borderingLink],
					from: newWaypointNode,
					to: newWaypointNode,
					length: -1
				}
			}
			const newCommonRoute = {
				...commonRoute,
				[end]: newWaypointNode,
				length: commonRoute.length + 1
			}
			if (end === 'from' && commonRoute.links.at(0) !== borderingLink) {
				newCommonRoute.links.unshift(borderingLink)
			} else if (end === 'to' && commonRoute.links.at(-1) !== borderingLink) {
				newCommonRoute.links.push(borderingLink)
			}
			commonRoutes.unshift(newCommonRoute)
		}
	}
	return {deepestBoxInPath: waypoint.watcher}
}

function isKnotBetweenLinks(link: Link, otherLink: Link, knotParent: Box): boolean {
	return isKnotBetweenLinksDirected(link, otherLink, knotParent)
		|| isKnotBetweenLinksDirected(otherLink, link, knotParent)
}

function isKnotBetweenLinksDirected(link: Link, followUpLink: Link, knotParent: Box): boolean {
	const linkToEndNodeId: string|undefined = link.getData().to.path.at(-1)?.boxId
	if (!linkToEndNodeId) {
		console.warn(`linkBundler.isKnotBetweenLinksDirected(link: ${link.describe()}, ..): link.getData().to.path is empty`)
		return false
	}
	const folloUpLinkFromEndNodeId: string|undefined = followUpLink.getData().from.path.at(-1)?.boxId
	if (!folloUpLinkFromEndNodeId) {
		console.warn(`linkBundler.isKnotBetweenLinksDirected(.., followUpLink: ${followUpLink.describe()}, ..): followUpLink.getData().from.path is empty`)
		return false
	}
	if (linkToEndNodeId !== folloUpLinkFromEndNodeId) {
		return false
	}
	return !!knotParent.nodes.getNodeById(linkToEndNodeId)
}

async function bundleLinkIntoCommonRoute(link: Link, commonRoute: {
	links: Link[]
	from: AbstractNodeWidget
	to: AbstractNodeWidget
}): Promise<void> {
	const bundleFromPart: boolean = link.getData().from.path.at(-1)?.boxId !== commonRoute.links.at(0)?.getData().from.path.at(-1)?.boxId
	const bundleToPart: boolean = link.getData().to.path.at(-1)?.boxId !== commonRoute.links.at(-1)?.getData().to.path.at(-1)?.boxId
	let fromLink: Link = link
	let toLink: Link = link
	if (bundleFromPart && bundleToPart) {
		if (link.to.isBoxInPath(commonRoute.to)) {
			toLink = await link.getManagingBoxLinks().addCopy(link)
		} else if (link.from.isBoxInPath(commonRoute.from)) {
			fromLink = await link.getManagingBoxLinks().addCopy(link)
		} else {
			console.warn(`linkBundler.bundleLinkIntoCommonRoute(link: ${link.describe()}, ..) failed to decide weather commonRoute.from or commonRoute.to is heavier`)
			return
		}
	}
	if (bundleFromPart) {
		const insertion = await bundleLinkEndIntoCommonRoute(fromLink.to, 'from', commonRoute)
		if (insertion && insertion.addedLink.getData().from.path.at(-1)?.boxId === insertion.insertedNode.getId()) {
			commonRoute.links.push(insertion.addedLink)
		}
	}
	if (bundleToPart) {
		await bundleLinkEndIntoCommonRoute(toLink.from, 'to', commonRoute)
	}
	if (!bundleFromPart && !bundleToPart) {
		console.warn(`linkBundler.bundleLinkIntoCommonRoute(link: ${link.describe()}, ..) detected duplicate link`)
	}
}

async function bundleLinkEndIntoCommonRoute(linkEnd: LinkEnd, end: 'from'|'to', commonRoute: {
	links: Link[]
	from: AbstractNodeWidget
	to: AbstractNodeWidget
}): Promise<{
	insertedNode: NodeWidget, addedLink: Link
} | undefined> {
	const commonEndNode: AbstractNodeWidget = commonRoute[end]
	if (commonEndNode instanceof NodeWidget) {
		await dragAndDropLinkEnd(linkEnd, commonEndNode)
		return undefined
	}
	
	if (!(commonEndNode instanceof Box)) {
		console.warn(`linkBundler.bundleLinkEndIntoCommonRoute(...) not implemented for commonEndNode instanceof ${commonEndNode.constructor.name}`)
		return undefined
	}
	const commonEndLink: Link|undefined = end === 'from'
		? commonRoute.links.at(0)
		: commonRoute.links.at(-1)
	if (!commonEndLink) {
		console.warn(`linkBundler.bundleLinkEndIntoCommonRoute(...) commonRoute.links is empty`)
		return undefined
	}

	const bundleKnot: NodeWidget|undefined = getKnotIfLinkConnected(commonEndLink, commonEndNode)
	if (bundleKnot) {
		await dragAndDropLinkEnd(linkEnd, bundleKnot)
		return undefined
	}
	
	const linkManagingBoxBefore: Box = commonEndLink.getManagingBox()
	const insertion: {insertedNode: NodeWidget, addedLink: Link} | undefined = await commonEndLink.getManagingBoxLinks().insertNodeIntoLink(
		commonEndLink,
		commonEndNode,
		await calculateBundleNodePosition(linkEnd.getReferenceLink(), commonEndLink, commonEndNode)
	)
	if (linkManagingBoxBefore !== commonEndLink.getManagingBox()) {
		console.warn(`linkBundler.bundleLinkEndIntoCommonRoute(..) did not expect BoxLinks::insertNodeIntoLink(link, ..) to change managingBox of link`)
	}
	await dragAndDropLinkEnd(linkEnd, insertion.insertedNode)
	return insertion
}

async function dragAndDropLinkEnd(linkEnd: LinkEnd, dropTarget: NodeWidget): Promise<void> {
	const bundleLinkNodePosition: ClientPosition = (await dropTarget.getClientShape()).getMidPosition()
	await linkEnd.dragAndDrop({dropTarget: dropTarget, clientPosition: bundleLinkNodePosition}) // TODO: do this with LocalPositions because ClientPositions may not work well when zoomed far away
}

function getKnotIfLinkConnected(link: Link, knotParent: Box): NodeWidget|undefined {
	return getKnotIfLinkEndConnected(link, 'from', knotParent)
		?? getKnotIfLinkEndConnected(link, 'to', knotParent)
}

function getKnotIfLinkEndConnected(link: Link, end: 'from'|'to', knotParent: Box): NodeWidget|undefined {
	const targetWaypoint: WayPointData|undefined = link.getData()[end].path.at(-1)
	if (!targetWaypoint) {
		console.warn(`linkBundler.getKnotIfLinkEndConnected(link: ${link.describe()}, ..) link.getData().${end}.path is empty`)
		return undefined
	}
	return knotParent.nodes.getNodeById(targetWaypoint.boxId)
}

async function calculateBundleNodePosition(link: Link, otherLink: Link, box: Box): Promise<ClientPosition> {
	const linkLine: {from: ClientPosition, to: ClientPosition} = await link.getLineInClientCoords()
	const otherLinkLine: {from: ClientPosition, to: ClientPosition} = await otherLink.getLineInClientCoords()
	const averageLine = { // TODO: include weights
		from: new ClientPosition((linkLine.from.x+otherLinkLine.from.x) / 2, (linkLine.from.y+otherLinkLine.from.y) / 2),
		to: new ClientPosition((linkLine.to.x+otherLinkLine.to.x) / 2, (linkLine.to.y+otherLinkLine.to.y) / 2)
	}
	const boxRect: ClientRect = await box.getClientRect()

	const intersections: ClientPosition[] = boxRect.calculateIntersectionsWithLine(averageLine)
	if (intersections.length !== 1) {
		console.warn(`linkBundler.calculateBundleNodePosition(..) expected exactly one intersection but are ${intersections.length}`)
	}
	return intersections.at(0) ?? boxRect.getMidPosition()
}

// TODO add a method like this to LinkEnd::getTargetAndRenderIfNecessary()?
async function getLinkEndNode(link: Link, end: 'from'|'to'): Promise<{
	node: Box|NodeWidget
	watcher: BoxWatcher
}> {
	const linkEndPath: WayPointData[] = link.getData()[end].path
	if (linkEndPath.length === 1 && linkEndPath[0].boxId === link.getManagingBox().getId()) {
		return {node: link.getManagingBox(), watcher: await BoxWatcher.newAndWatch(link.getManagingBox())}
	}
	return link.getManagingBox().getDescendantByPathAndRenderIfNecessary(linkEndPath.map(wayPoint => {
		return {id: wayPoint.boxId}
	}))
}
