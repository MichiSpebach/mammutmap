/**
 * pluginFacade not used in imports because
 * some imports could not be resolved when importing from '../dist/pluginFacade' and cause:
 * "TypeError: Class extends value undefined is not a constructor or null"
 * TODO fix this!
 */
import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'
import { ClientRect } from '../../dist/core/ClientRect'
import { LinkEnd } from '../../dist/core/link/LinkEnd'
import { ClientPosition } from '../../dist/core/shape/ClientPosition'
import { Box } from '../../dist/core/box/Box'
import { Link } from '../../dist/core/link/Link'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import * as commonRouteFinder from './commonRouteFinder'
import * as knotMerger from './knotMerger'
import { HighlightPropagatingLink } from './HighlightPropagatingLink'
import { CommonRoute } from './CommonRoute'
import { util } from '../../dist/core/util/util'
import { BoxWatcher } from '../../dist/core/box/BoxWatcher'

export async function bundleLink(link: Link, options?: {
	unwatchDelayInMs?: number
	entangleLinks?: boolean
}): Promise<void> {
	const {route: longestCommonRoute, deepestBoxInFromPath, deepestBoxInToPath} = await commonRouteFinder.findLongestCommonRouteWithWatchers(link)

	if (longestCommonRoute && longestCommonRoute.getLength() > 0) {
		console.log(`bundle ${link.describe()} between ${longestCommonRoute.getFrom().getName()} and ${longestCommonRoute.getTo().getName()}.`)
		await bundleLinkIntoCommonRoute(link, longestCommonRoute, options)
	}

	if (options?.unwatchDelayInMs) {
		setTimeout(() => {
			deepestBoxInFromPath.unwatch()
			deepestBoxInToPath.unwatch()
		}, options.unwatchDelayInMs)
	} else {
		await Promise.all([
			deepestBoxInFromPath.unwatch(),
			deepestBoxInToPath.unwatch()
		])
	}
}

async function bundleLinkIntoCommonRoute(link: Link, commonRoute: CommonRoute, options?: {
	unwatchDelayInMs?: number
	entangleLinks?: boolean
}): Promise<void> {
	if (!options) {
		options = {}
	}
	if (options.entangleLinks === undefined) { // TODO: remove and deactivate by default
		options.entangleLinks = true
	}
	const routeIds: {ids: string[], added: boolean}[] = await Promise.all([
		ensureRouteOfLinkHasId(link, options),
		ensureRouteOfLinkHasId(commonRoute.links[0], options)
	])
	const routeIdsToRemoveIfRedundant: string[] = routeIds[0].added || !routeIds[1].added
		? routeIds[0].ids
		: routeIds[1].ids
	
	const bundleFromPart: boolean = link.from.getTargetNodeId() !== commonRoute.getEndLink('from').from.getTargetNodeId()
	const bundleToPart: boolean = link.to.getTargetNodeId() !== commonRoute.getEndLink('to').to.getTargetNodeId()
	if (!bundleFromPart && !bundleToPart) {
		await Promise.all([
			addRouteIdsOfLinkToRoute(commonRoute.links, link),
			ensureNoRedundantRouteIds(commonRoute.links, routeIdsToRemoveIfRedundant, options),
			link.getManagingBoxLinks().removeLink(link)
		])
		return
	}

	let fromLink: Link = link
	let toLink: Link = link
	if (bundleFromPart && bundleToPart) {
		if (isLinkEndKnotTemporaryAndWillBeMerged(link.to, commonRoute, 'to')) {
			toLink = await link.getManagingBoxLinks().addCopy(link)
		} else if (isLinkEndKnotTemporaryAndWillBeMerged(link.from, commonRoute, 'from')) {
			fromLink = await link.getManagingBoxLinks().addCopy(link)
		} else if (link.to.isBoxInPath(commonRoute.getEndBox('to'))) {
			toLink = await link.getManagingBoxLinks().addCopy(link)
		} else if (link.from.isBoxInPath(commonRoute.getEndBox('from'))) {
			fromLink = await link.getManagingBoxLinks().addCopy(link)
		} else {
			console.warn(`linkBundler.bundleLinkIntoCommonRoute(link: ${link.describe()}, ..) failed to decide weather commonRoute.from or commonRoute.to is heavier`)
			return
		}
	} else if (bundleFromPart) {
		toLink = commonRoute.getEndLink('to')
	} else if (bundleToPart) {
		fromLink = commonRoute.getEndLink('from')
	}

	let fromInsertion: {insertedNode: NodeWidget, addedLink: Link} | undefined
	let toInsertion: {insertedNode: NodeWidget, addedLink: Link} | undefined
	if (bundleFromPart) {
		fromInsertion = await bundleLinkEndIntoCommonRoute(fromLink.to, 'from', commonRoute)
	}
	if (bundleToPart) {
		toInsertion = await bundleLinkEndIntoCommonRoute(toLink.from, 'to', commonRoute)
	}

	const startIndex: number|undefined = commonRoute.links.at(0)?.to.getTargetNodeId() === link.to.getTargetNodeId() ? 1 : undefined
	const endIndex: number|undefined = commonRoute.links.at(-1)?.from.getTargetNodeId() === link.from.getTargetNodeId() ? -1 : undefined
	await addRouteIdsOfLinkToRoute(startIndex || endIndex ? commonRoute.links.slice(startIndex, endIndex) : commonRoute.links, link)
	if (options.entangleLinks) {
		await updateEntangledLinks(bundleFromPart, bundleToPart, commonRoute, fromLink, toLink)
	}

	//await Promise.all([
		const ingoingMergedIntoLinks: Link[]|undefined = (await mergeIfKnotsAndIfPossible(commonRoute.getFrom(), fromLink.from, fromInsertion?.insertedNode))?.mergedIntoLinks
		const outgoingMergedIntoLinks: Link[]|undefined = (await mergeIfKnotsAndIfPossible(commonRoute.getTo(), toLink.to, toInsertion?.insertedNode))?.mergedIntoLinks
	//])

	const routesToCheckRouteIds: {from: Link, to: Link}[] = (await Promise.all([
		getRoutesToCheckForRedundantRouteIds(ingoingMergedIntoLinks, commonRoute.getEndLink('to'), 'to', 'getOutgoing', options),
		getRoutesToCheckForRedundantRouteIds(outgoingMergedIntoLinks, commonRoute.getEndLink('from'), 'from', 'getIngoing', options)
	])).flat()
	for (let i = routesToCheckRouteIds.length-1; i >= 0; i--) {
		for (let j = i-1; j >= 0; j--) {
			const routeI = routesToCheckRouteIds[i]
			const routeJ = routesToCheckRouteIds[j]
			if (routeI.from === routeJ.from && routeI.to === routeJ.to) {
				routesToCheckRouteIds.splice(i, 1)
			}
		}
	}
	await Promise.all(routesToCheckRouteIds.map(async routeToCheck => {
		let linksToCheck: Link[] = commonRoute.links
		if (linksToCheck.at(0) !== routeToCheck.from) {
			linksToCheck = [routeToCheck.from, ...linksToCheck]
		}
		if (linksToCheck.at(-1) !== routeToCheck.to) {
			linksToCheck = [...linksToCheck, routeToCheck.to]
		}
		await ensureNoRedundantRouteIds(linksToCheck, routeIdsToRemoveIfRedundant, options)
	}))
}

async function ensureRouteOfLinkHasId(link: Link, options?: {unwatchDelayInMs?: number}): Promise<{ids: string[], added: boolean}> {
	if (HighlightPropagatingLink.getRouteIds(link).length > 0) {
		return {ids: HighlightPropagatingLink.getRouteIds(link), added: false}
	}

	const routeId: string = util.generateId()
	const pros: Promise<void>[] = []
	const routeLinks: {link: Link, watcher: BoxWatcher}[] = await HighlightPropagatingLink.getRouteAndRenderIfNecessary(link)
	for (const routeLink of routeLinks) {
		if (HighlightPropagatingLink.getRouteIds(routeLink.link).length > 0) {
			console.warn(`linkBundler.ensureRouteOfLinkHasId(link: ${link.describe()}) routeLink with id '${routeLink.link.getId()}' is already part of a route`)
		}
		HighlightPropagatingLink.addRoute(routeLink.link, routeId)
		pros.push(routeLink.link.getManagingBox().saveMapData())
		if (!options?.unwatchDelayInMs) {
			pros.push(routeLink.watcher.unwatch())
		}
	}

	if (options?.unwatchDelayInMs) {
		setTimeout(() => routeLinks.forEach(routeLink => routeLink.watcher.unwatch()), options.unwatchDelayInMs)
	}
	await Promise.all(pros)
	return {ids: [routeId], added: true}
}

async function addRouteIdsOfLinkToRoute(route: Link[], link: Link): Promise<void> {
	const pros: Promise<void>[] = []
	for (const routeLink of route) {
		HighlightPropagatingLink.addRoutes(routeLink, HighlightPropagatingLink.getRouteIds(link))
		pros.push(routeLink.getManagingBox().saveMapData())
	}
	await Promise.all(pros)
}

async function getRoutesToCheckForRedundantRouteIds(
	endLinks: Link[]|undefined,
	otherEndLink: Link,
	otherEnd: 'to'|'from',
	getOtherEndLinks: 'getOutgoing'|'getIngoing',
	options?: {unwatchDelayInMs?: number}
): Promise<{from: Link, to: Link}[]> {
	if (!endLinks || endLinks.length < 1) {
		return []
	}
	
	const target: {node: AbstractNodeWidget, watcher: BoxWatcher} = await otherEndLink[otherEnd].getTargetAndRenderIfNecessary()
	let otherEndLinks: Link[] = [otherEndLink]
	if (target.node instanceof NodeWidget) {
		otherEndLinks = target.node.borderingLinks[getOtherEndLinks]()
		if (otherEndLinks.length < 1) {
			otherEndLinks = [otherEndLink]
		}
	}

	const routesToCheck: {from: Link, to: Link}[] = []
	for (const endLink of endLinks) {
		const endLinkRouteIds: string[] = HighlightPropagatingLink.getRouteIds(endLink)
		for (const otherEndLink of otherEndLinks) {
			const otherEndLinkRouteIds: string[] = HighlightPropagatingLink.getRouteIds(otherEndLink)
			if (endLinkRouteIds.every(endLinkRouteId => otherEndLinkRouteIds.includes(endLinkRouteId))) {
				if (otherEnd === 'to') {
					routesToCheck.push({from: endLink, to: otherEndLink})
				} else {
					routesToCheck.push({from: otherEndLink, to: endLink})
				}
			}
		}
	}

	if (options?.unwatchDelayInMs) {
		setTimeout(() => target.watcher.unwatch(), options.unwatchDelayInMs)
	} else {
		await target.watcher.unwatch()
	}
	return routesToCheck
}

async function ensureNoRedundantRouteIds(route: Link[], routeIdsToRemoveIfRedundant: string[], options?: {unwatchDelayInMs?: number}): Promise<void> {
	const fromLinkRouteIds: string[] = HighlightPropagatingLink.getRouteIds(route.at(0)!)
	const toLinkRouteIds: string[] = HighlightPropagatingLink.getRouteIds(route.at(-1)!)
	if (fromLinkRouteIds.length <= 1 || toLinkRouteIds.length <= 1) {
		return
	}
	let routeIdsOfRoute: string[] = fromLinkRouteIds.filter(routeId => toLinkRouteIds.includes(routeId))
	if (routeIdsOfRoute.length <= 1) {
		return
	}
	const [from, to]: {node: AbstractNodeWidget, watcher: BoxWatcher}[] = await Promise.all([
		route.at(0)!.from.getTargetAndRenderIfNecessary(),
		route.at(-1)!.to.getTargetAndRenderIfNecessary()
	])
	if (from.node instanceof NodeWidget && from.node.borderingLinks.getIngoing().length > 0 || to.node instanceof NodeWidget && to.node.borderingLinks.getOutgoing().length > 0) {
		return
	}

	const routeIdToKeep: string = routeIdsOfRoute.filter(routeId => !routeIdsToRemoveIfRedundant.includes(routeId))[0]
	const routeIdsToRemove = routeIdsOfRoute.filter(routeId => routeId !== routeIdToKeep)
	console.warn(`linkBundler.ensureNoRedundantRouteIds(from: '${from.node.getName()}', to: '${to.node.getName()}', ..) detected redundant routeIds [${routeIdsOfRoute}], removing them except '${routeIdToKeep}'`)
	const pros: Promise<void>[] = []
	for (const link of route) {
		if (!HighlightPropagatingLink.getRouteIds(link).includes(routeIdToKeep)) {
			console.warn(`linkBundler.ensureNoRedundantRouteIds(from: '${from.node.getName()}', to: '${to.node.getName()}', ..) routeIdToKeep '${routeIdToKeep}' is not included in "${link.describe()}"`)
		}
		for (const routeIdToRemove of routeIdsToRemove) {
			HighlightPropagatingLink.removeRoute(link, routeIdToRemove)
		}
		pros.push(link.getManagingBox().saveMapData())
	}

	if (options?.unwatchDelayInMs) {
		setTimeout(() => {
			from.watcher.unwatch()
			to.watcher.unwatch()
		}, options.unwatchDelayInMs)
	} else {
		pros.push(from.watcher.unwatch())
		pros.push(to.watcher.unwatch())
	}
	await Promise.all(pros)
}

function isLinkEndKnotTemporaryAndWillBeMerged(linkEnd: LinkEnd, commonRoute: CommonRoute, commonRouteEnd: 'from'|'to'): boolean {
	/*if (getBundleKnot(commonRoute, commonRouteEnd)) { TODO: write test case that needs this, does not exist
		return true
	}*/
	const commonEndNode: AbstractNodeWidget = commonRoute[commonRouteEnd]
	if (commonEndNode instanceof NodeWidget) { // TODO: remove when getBundleKnot(commonRoute, commonRouteEnd) is used instead
		return true
	}
	if (!(commonEndNode instanceof Box)) {
		console.warn(`bundler.isLinkEndKnotTemporaryAndWillBeMerged(...) not implemented for commonEndNode instanceof ${commonEndNode.constructor.name}`)
		return false
	}
	return !!commonEndNode.nodes.getNodeById(linkEnd.getTargetNodeId())
}

async function mergeIfKnotsAndIfPossible(commonRouteEnd: AbstractNodeWidget, linkEnd: LinkEnd, insertedNode: NodeWidget|undefined): Promise<{mergedIntoLinks: Link[]}|void> {
	if (commonRouteEnd.getId() === linkEnd.getTargetNodeId()) {
		return
	}
	const commonRouteEndBox: Box = commonRouteEnd instanceof Box
		? commonRouteEnd
		: commonRouteEnd.getParent() as Box
	if (!(commonRouteEndBox instanceof Box)) {
		console.warn(`bundler.mergeIfKnotsAndIfPossible(...) commonRouteEndBox is not instanceof Box`)
	}
	const linkEndKnot: NodeWidget|undefined = commonRouteEndBox.nodes.getNodeById(linkEnd.getTargetNodeId())
	if (!linkEndKnot) {
		return
	}

	if (insertedNode) {
		return await knotMerger.mergeKnotInto(insertedNode, linkEndKnot)
	}
	if (commonRouteEnd instanceof NodeWidget) {
		return await knotMerger.mergeKnotInto(linkEndKnot, commonRouteEnd)
	}
}

async function bundleLinkEndIntoCommonRoute(linkEnd: LinkEnd, end: 'from'|'to', commonRoute: CommonRoute): Promise<{
	insertedNode: NodeWidget, addedLink: Link
} | undefined> {
	const bundleKnot: NodeWidget|undefined = getBundleKnot(commonRoute, end)
	if (bundleKnot) {
		await dragAndDropLinkEnd(linkEnd, bundleKnot)
		return undefined
	}
	
	const commonEndNode: AbstractNodeWidget = commonRoute[end]
	if (!(commonEndNode instanceof Box)) {
		console.warn(`linkBundler.bundleLinkEndIntoCommonRoute(...) not implemented for commonEndNode instanceof ${commonEndNode.constructor.name}`)
		return undefined
	}
	const commonEndLink: Link = commonRoute.getEndLink(end)
	const linkManagingBoxBefore: Box = commonEndLink.getManagingBox()
	const insertion: {insertedNode: NodeWidget, addedLink: Link} = await commonEndLink.getManagingBoxLinks().insertNodeIntoLink(
		commonEndLink,
		commonEndNode,
		await calculateBundleNodePosition(linkEnd.getReferenceLink(), commonEndLink, commonEndNode)
	)
	if (insertion.addedLink[end].getTargetNodeId() === insertion.insertedNode.getId()) {
		if ((commonRoute as any)?.links?.length !== 1) {
			console.warn(`linkBundler.bundleLinkEndIntoCommonRoute(...) expected commonRoute to consist of exactly one link at this state, but are ${(commonRoute as any)?.links?.length}`)
		}
		const otherEnd: 'from'|'to' = end === 'to' ? 'from' : 'to'
		commonRoute.addLink(otherEnd, insertion.addedLink)
	}
	commonRoute.elongateWithWaypoint(end, insertion.insertedNode, {noLengthIncrement: true})
	if (linkManagingBoxBefore !== commonEndLink.getManagingBox()) {
		console.warn(`linkBundler.bundleLinkEndIntoCommonRoute(..) did not expect BoxLinks::insertNodeIntoLink(link, ..) to change managingBox of link`)
	}
	await dragAndDropLinkEnd(linkEnd, insertion.insertedNode)
	return insertion
}

function getBundleKnot(commonRoute: CommonRoute, end: 'from'|'to'): NodeWidget|undefined {
	const commonEndNode: AbstractNodeWidget = commonRoute[end]
	if (commonEndNode instanceof NodeWidget) {
		return commonEndNode
	}
	if (!(commonEndNode instanceof Box)) {
		console.warn(`bundler.getBundleKnot(...) not implemented for commonEndNode instanceof ${commonEndNode.constructor.name}`)
		return undefined
	}
	const commonEndLink: Link = commonRoute.getEndLink(end)
	const otherEnd: 'from'|'to' = end === 'from' ? 'to' : 'from'
	return commonRouteFinder.getKnotIfLinkEndConnected(commonEndLink, otherEnd, commonEndNode)
}

async function dragAndDropLinkEnd(linkEnd: LinkEnd, dropTarget: NodeWidget): Promise<void> {
	const bundleLinkNodePosition: ClientPosition = (await dropTarget.getClientShape()).getMidPosition()
	await linkEnd.dragAndDrop({dropTarget: dropTarget, clientPosition: bundleLinkNodePosition}) // TODO: do this with LocalPositions because ClientPositions may not work well when zoomed far away
}

/** TODO: return Promise<LocalPosition> */
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

async function updateEntangledLinks(
	bundleFromPart: boolean,
	bundleToPart: boolean,
	commonRoute: CommonRoute,
	fromLink: Link,
	toLink: Link
) {
	const fromForkingKnot: NodeWidget = commonRoute.getEndKnot('from')
	const toForkingKnot: NodeWidget = commonRoute.getEndKnot('to')
	const fromLinks: Link[] = fromForkingKnot.borderingLinks.getIngoing()
	const fromLinksExistedBefore: Link[] = bundleFromPart ? fromLinks.filter(link => link !== fromLink) : fromLinks
	const toLinks: Link[] = toForkingKnot.borderingLinks.getOutgoing()
	const toLinksExistedBefore: Link[] = bundleToPart ? toLinks.filter(link => link !== toLink) : toLinks
	if (bundleFromPart && toLinks.length > 1 || bundleToPart && fromLinks.length > 1) {
		await Promise.all([
			...fromLinksExistedBefore.map(async link => {
				if (HighlightPropagatingLink.getBundledWithIds(link).length > 0) { // TODO: move into function
					return
				}
				HighlightPropagatingLink.addBundledWith(link, toLinksExistedBefore)
				await link.getManagingBox().saveMapData()
			}),
			...toLinksExistedBefore.map(async link => {
				if (HighlightPropagatingLink.getBundledWithIds(link).length > 0) { // TODO: move into function
					return
				}
				HighlightPropagatingLink.addBundledWith(link, fromLinksExistedBefore)
				await link.getManagingBox().saveMapData()
			}),
			HighlightPropagatingLink.addBundledWith(fromLink, [toLink]),
			await fromLink.getManagingBox().saveMapData(),
			HighlightPropagatingLink.addBundledWith(toLink, [fromLink]),
			await toLink.getManagingBox().saveMapData()
		])
	}
}