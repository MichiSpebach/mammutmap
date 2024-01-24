/**
 * pluginFacade not used in imports because
 * some imports could not be resolved when importing from '../dist/pluginFacade' and cause:
 * "TypeError: Class extends value undefined is not a constructor or null"
 * TODO fix this!
 */
import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'
import { Box } from '../../dist/core/box/Box'
import { BoxWatcher } from '../../dist/core/box/BoxWatcher'
import { Link } from '../../dist/core/link/Link'
import { WayPointData } from '../../dist/core/mapData/WayPointData'
import { NodeWidget } from '../../dist/core/node/NodeWidget'

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