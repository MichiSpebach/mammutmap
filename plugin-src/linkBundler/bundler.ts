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
import { BoxWatcher } from '../../dist/core/box/BoxWatcher'

export async function bundleLink(link: Link, options?: {
	unwatchDelayInMs?: number
}): Promise<void> {
	const {route: longestCommonRoute, deepestBoxInFromPath, deepestBoxInToPath} = await commonRouteFinder.findLongestCommonRouteWithWatchers(link)

	if (longestCommonRoute && longestCommonRoute.length > 0) {
		console.log(`bundle ${link.describe()} between ${longestCommonRoute.from.getName()} and ${longestCommonRoute.to.getName()}.`)
		await bundleLinkIntoCommonRoute(link, longestCommonRoute)
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

async function bundleLinkIntoCommonRoute(link: Link, commonRoute: CommonRoute): Promise<void> {
	const bundleFromPart: boolean = link.from.getTargetNodeId() !== commonRoute.links.at(0)?.from.getTargetNodeId()
	const bundleToPart: boolean = link.to.getTargetNodeId() !== commonRoute.links.at(-1)?.to.getTargetNodeId()
	if (!bundleFromPart && !bundleToPart) {
		console.warn(`linkBundler.bundleLinkIntoCommonRoute(link: ${link.describe()}, ..) detected duplicate link`) // TODO: should be fixed with new route finder (RouteTree based)
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
		toLink = commonRoute.links.at(-1)! // TODO
	} else {
		fromLink = commonRoute.links.at(0)! // TODO
	}

	let fromInsertion: {insertedNode: NodeWidget, addedLink: Link} | undefined
	let toInsertion: {insertedNode: NodeWidget, addedLink: Link} | undefined
	if (bundleFromPart) {
		fromInsertion = await bundleLinkEndIntoCommonRoute(fromLink.to, 'from', commonRoute)
		if (fromInsertion && fromInsertion.addedLink.from.getTargetNodeId() === fromInsertion.insertedNode.getId()) {
			commonRoute.links.push(fromInsertion.addedLink)
		}
	}
	if (bundleToPart) {
		toInsertion = await bundleLinkEndIntoCommonRoute(toLink.from, 'to', commonRoute)
	}

	await updateEntangledLinks(bundleFromPart, bundleToPart, commonRoute, fromLink, toLink)

	//await Promise.all([
		await mergeIfKnotsAndIfPossible(commonRoute.from, fromLink.from, fromInsertion?.insertedNode)
		await mergeIfKnotsAndIfPossible(commonRoute.to, toLink.to, toInsertion?.insertedNode)
	//])
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

async function mergeIfKnotsAndIfPossible(commonRouteEnd: AbstractNodeWidget, linkEnd: LinkEnd, insertedNode: NodeWidget|undefined): Promise<void> {
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
		await knotMerger.mergeKnotInto(insertedNode, linkEndKnot)
		return
	}
	if (commonRouteEnd instanceof NodeWidget) {
		await knotMerger.mergeKnotInto(linkEndKnot, commonRouteEnd)
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
	commonRoute[end] = insertion.insertedNode
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
	let fromForkingKnot: AbstractNodeWidget
	if (bundleFromPart) {
		fromForkingKnot = commonRoute.from
	} else {
		const fromForkingKnotWithWatcher: {node: AbstractNodeWidget, watcher: BoxWatcher} = await fromLink.to.getTargetAndRenderIfNecessary() // TODO: add knots to CommonRoute
		fromForkingKnot = fromForkingKnotWithWatcher.node
	}
	if (!(fromForkingKnot instanceof NodeWidget)) {
		console.warn('bundler.bundleLinkIntoCommonRoute(..) fromForkingKnot is not instanceof NodeWidget')
	}
	let toForkingKnot: AbstractNodeWidget
	if (bundleToPart) {
		toForkingKnot = commonRoute.to
	} else {
		const toForkingKnotWithWatcher: {node: AbstractNodeWidget, watcher: BoxWatcher} = await toLink.from.getTargetAndRenderIfNecessary() // TODO: add knots to CommonRoute
		toForkingKnot = toForkingKnotWithWatcher.node
	}
	if (!(toForkingKnot instanceof NodeWidget)) {
		console.warn('bundler.bundleLinkIntoCommonRoute(..) toForkingKnot is not instanceof NodeWidget')
	}
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