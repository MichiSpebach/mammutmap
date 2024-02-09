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

async function bundleLinkIntoCommonRoute(link: Link, commonRoute: {
	links: Link[]
	from: AbstractNodeWidget
	to: AbstractNodeWidget
}): Promise<void> {
	let bundleOrMergeFromPart: boolean = link.from.getTargetNodeId() !== commonRoute.links.at(0)?.from.getTargetNodeId()
	let bundleOrMergeToPart: boolean = link.to.getTargetNodeId() !== commonRoute.links.at(-1)?.to.getTargetNodeId()
	if (!bundleOrMergeFromPart && !bundleOrMergeToPart) {
		console.warn(`linkBundler.bundleLinkIntoCommonRoute(link: ${link.describe()}, ..) detected duplicate link`)
		return
	}

	if (bundleOrMergeFromPart && commonRoute.from instanceof NodeWidget && await tryToMergeKnotInto(link.from.getTargetNodeId(), commonRoute.from)) {
		bundleOrMergeFromPart = false
	}
	if (bundleOrMergeToPart && commonRoute.to instanceof NodeWidget && await tryToMergeKnotInto(link.to.getTargetNodeId(), commonRoute.to)) {
		bundleOrMergeToPart = false
	}

	let fromLink: Link = link
	let toLink: Link = link
	if (bundleOrMergeFromPart && bundleOrMergeToPart) {
		const commonRouteToBox = commonRoute.to instanceof Box ? commonRoute.to : commonRoute.to.getParent() // TODO: introduce class 'CommonRoute' with method 'getEndBox(end: 'from'|'to'): Box'
		const commonRouteFromBox = commonRoute.from instanceof Box ? commonRoute.from : commonRoute.from.getParent()
		if (link.to.isBoxInPath(commonRouteToBox)) {
			toLink = await link.getManagingBoxLinks().addCopy(link)
		} else if (link.from.isBoxInPath(commonRouteFromBox)) {
			fromLink = await link.getManagingBoxLinks().addCopy(link)
		} else {
			console.warn(`linkBundler.bundleLinkIntoCommonRoute(link: ${link.describe()}, ..) failed to decide weather commonRoute.from or commonRoute.to is heavier`)
			return
		}
		HighlightPropagatingLink.addBundledWith(fromLink, [toLink])
		HighlightPropagatingLink.addBundledWith(toLink, [fromLink])
	}

	let fromInsertion: {insertedNode: NodeWidget, addedLink: Link} | undefined
	let toInsertion: {insertedNode: NodeWidget, addedLink: Link} | undefined
	if (bundleOrMergeFromPart) {
		fromInsertion = await bundleLinkEndIntoCommonRoute(fromLink.to, 'from', commonRoute)
		if (fromInsertion && fromInsertion.addedLink.from.getTargetNodeId() === fromInsertion.insertedNode.getId()) {
			commonRoute.links.push(fromInsertion.addedLink)
		}
		if (fromInsertion) {
			await knotMerger.mergeKnot(fromInsertion.insertedNode)
		}
	}
	if (bundleOrMergeToPart) {
		toInsertion = await bundleLinkEndIntoCommonRoute(toLink.from, 'to', commonRoute)
		if (toInsertion) {
			await knotMerger.mergeKnot(toInsertion.insertedNode)
		}
	}
	
	//if (bundleOrMergeFromPart && bundleOrMergeToPart) { TODO cleanup
		const fromKnot: NodeWidget|undefined = fromInsertion?.insertedNode//?? commonRoute.from TODO cleanup
		if (!fromKnot) {
			//console.warn('bundler.bundleLinkIntoCommonRoute(..) fromKnot is not instanceof NodeWidget') TODO cleanup
			return
		}
		const toKnot: NodeWidget|undefined = toInsertion?.insertedNode//?? commonRoute.to TODO cleanup
		if (!toKnot) {
			//console.warn('bundler.bundleLinkIntoCommonRoute(..) toKnot is not instanceof NodeWidget') TODO cleanup
			return
		}
		const fromBundleLinks: Link[] = fromKnot.borderingLinks.getIngoing().filter(link => link !== fromLink)
		const toBundleLinks: Link[] = toKnot.borderingLinks.getOutgoing().filter(link => link !== toLink)

		await Promise.all([
			...fromBundleLinks.map(async link => {
				HighlightPropagatingLink.addBundledWith(link, toBundleLinks)
				await link.getManagingBox().saveMapData()
			}),
			...toBundleLinks.map(async link => {
				HighlightPropagatingLink.addBundledWith(link, fromBundleLinks)
				await link.getManagingBox().saveMapData()
			})
		])
	//}
}

async function tryToMergeKnotInto(knotId: string, mergeIntoKnot: NodeWidget): Promise<boolean> {
	const knotToMerge: NodeWidget|undefined = mergeIntoKnot.getParent().nodes.getNodeById(knotId)
	if (!knotToMerge) {
		return false
	}
	await knotMerger.mergeKnotInto(knotToMerge, mergeIntoKnot)
	return true
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
	const commonEndLink: Link = commonRouteFinder.getEndLinkOfCommonRoute(commonRoute, end)
	const otherEnd: 'from'|'to' = end === 'from' ? 'to' : 'from'
	const bundleKnot: NodeWidget|undefined = commonRouteFinder.getKnotIfLinkEndConnected(commonEndLink, otherEnd, commonEndNode)
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