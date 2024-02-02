/**
 * pluginFacade not used in imports because
 * some imports could not be resolved when importing from '../dist/pluginFacade' and cause:
 * "TypeError: Class extends value undefined is not a constructor or null"
 * TODO fix this!
 */
import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'
import { ClientRect } from '../../dist/core/ClientRect'
import { Box } from '../../dist/core/box/Box'
import { BoxWatcher } from '../../dist/core/box/BoxWatcher'
import { Link } from '../../dist/core/link/Link'
import { WayPointData } from '../../dist/core/mapData/WayPointData'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { ClientPosition } from '../../dist/core/shape/ClientPosition'
import { Line } from '../../dist/core/shape/Line'

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

export async function findLongestCommonRouteWithWatchers(link: Link): Promise<{
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

	let longestCommonRouteLength = 0
	for (const commonRoute of commonRoutes) {
		if (commonRoute.length > longestCommonRouteLength) {
			longestCommonRouteLength = commonRoute.length
		}
	}
	const longestCommonRoutes = commonRoutes.filter(route => route.length >= longestCommonRouteLength)

	let longestCommonRoute = longestCommonRoutes[0]
	for (const commonRoute of longestCommonRoutes) {
		extendCommonRouteEndWithKnot(commonRoute, 'from')
		extendCommonRouteEndWithKnot(commonRoute, 'to')
		if (countEndKnotsOfRoute(commonRoute) > countEndKnotsOfRoute(longestCommonRoute)) {
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
	const managingBox: Box = link.getManagingBox()
	const linkLine: {from: ClientPosition, to: ClientPosition} = await link.getLineInClientCoords()
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
		const waypointRect: ClientRect = await waypoint.node.getClientShape()
		const borderingLinks: Link[] = end === 'from'
			? waypoint.node.borderingLinks.getOutgoing()
			: waypoint.node.borderingLinks.getIngoing()
		for (const borderingLink of borderingLinks) {
			if (borderingLink === link) {
				continue
			}
			if (!canLinksBeBundled(linkLine, await borderingLink.getLineInClientCoords(), waypointRect)) {
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

/** TODO: do this with LocalPositions because ClientPositions may not work well when zoomed far away */
function canLinksBeBundled(
	linkLine: {from: ClientPosition, to: ClientPosition},
	otherLinkLine: {from: ClientPosition, to: ClientPosition},
	intersectionRect: ClientRect
): boolean {
	const elongationEpsilon: number = Math.sqrt(intersectionRect.width*intersectionRect.width + intersectionRect.height*intersectionRect.height) / 100
	linkLine = new Line(linkLine.from, linkLine.to).elongate(elongationEpsilon)
	otherLinkLine = new Line(otherLinkLine.from, otherLinkLine.to).elongate(elongationEpsilon)
	
	const intersections: ClientPosition[] = intersectionRect.calculateIntersectionsWithLine(linkLine)
	if (intersections.length === 0) {
		console.warn(`commonRouteFinder.canLinksBeBundled(.., linkLine: ${JSON.stringify(linkLine)}, intersectionRect: ${JSON.stringify(intersectionRect)}) intersections.length === 0, returning false`)
		return false
	}
	if (intersections.length !== 1) {
		console.warn(`commonRouteFinder.canLinksBeBundled(.., linkLine: ${JSON.stringify(linkLine)}, intersectionRect: ${JSON.stringify(intersectionRect)}) expected exactly one intersection with linkLine, but are ${intersections.length}`)
	}
	const otherIntersections: ClientPosition[] = intersectionRect.calculateIntersectionsWithLine(otherLinkLine)
	if (otherIntersections.length === 0) {
		console.warn(`commonRouteFinder.canLinksBeBundled(.., otherLinkLine: ${JSON.stringify(otherLinkLine)}, intersectionRect: ${JSON.stringify(intersectionRect)}) otherIntersections.length === 0, returning false`)
		return false
	}
	if (otherIntersections.length !== 1) {
		console.warn(`commonRouteFinder.canLinksBeBundled(.., otherLinkLine: ${JSON.stringify(otherLinkLine)}, intersectionRect: ${JSON.stringify(intersectionRect)}) expected exactly one intersection with otherLinkLine, but are ${otherIntersections.length}`)
	}
	const intersection: ClientPosition = intersections[0]
	const otherIntersection: ClientPosition = otherIntersections[0]
	const horizontalEpsilon: number = intersectionRect.width/100
	const verticalEpsilon: number = intersectionRect.height/100
	if (areNearlyEqual([intersectionRect.x, intersection.x, otherIntersection.x], horizontalEpsilon)) {
		return true
	}
	if (areNearlyEqual([intersectionRect.getRightX(), intersection.x, otherIntersection.x], horizontalEpsilon)) {
		return true
	}
	if (areNearlyEqual([intersectionRect.y, intersection.y, otherIntersection.y], verticalEpsilon)) {
		return true
	}
	if (areNearlyEqual([intersectionRect.getBottomY(), intersection.y, otherIntersection.y], verticalEpsilon)) {
		return true
	}
	return false
}

function areNearlyEqual(values: number[], epsilon: number): boolean {
	const value: number = values[0]
	for (let i = 1; i < values.length; i++) {
		if (Math.abs(value - values[i]) > epsilon) {
			return false
		}
	}
	return true
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

function extendCommonRouteEndWithKnot(route: {
	links: Link[]
	from: AbstractNodeWidget
	to: AbstractNodeWidget
}, end: 'from'|'to'): void {
	const endNode: AbstractNodeWidget = route[end]
	if (!(endNode instanceof Box)) {
		return
	}
	const endLink: Link = getEndLinkOfCommonRoute(route, end)
	const endKnot: NodeWidget|undefined = getKnotIfLinkEndConnected(endLink, end, endNode)
	if (endKnot) {
		route[end] = endKnot
	}
}

/** TODO: introduce class 'CommonRoute' with method 'getEndLink(end: 'from'|'to'): Link' */
export function getEndLinkOfCommonRoute(route: {
	links: Link[]
	from: AbstractNodeWidget
	to: AbstractNodeWidget
}, end: 'from'|'to'): Link {
	const endLink: Link|undefined = end === 'from'
		? route.links.at(0)
		: route.links.at(-1)
	if (!endLink) {
		console.warn(`commonRouteFinder.getEndLinkOfCommonRoute(...) route.links is empty`)
	}
	return endLink!
}

function getKnotIfLinkEndConnected(link: Link, end: 'from'|'to', knotParent: Box): NodeWidget|undefined {
	const targetWaypoint: WayPointData|undefined = link.getData()[end].path.at(-1)
	if (!targetWaypoint) {
		console.warn(`linkBundler.getKnotIfLinkEndConnected(link: ${link.describe()}, ..) link.getData().${end}.path is empty`)
		return undefined
	}
	return knotParent.nodes.getNodeById(targetWaypoint.boxId)
}

function countEndKnotsOfRoute(route: {from: AbstractNodeWidget, to: AbstractNodeWidget}): number {
	let count = 0
	if (route.from instanceof NodeWidget) {
		count++
	}
	if (route.to instanceof NodeWidget) {
		count++
	}
	return count
}