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

export async function bundleLink(link: Link, options?: {
	unwatchDelayInMs?: number
}): Promise<void> {
	const {route: longestCommonRoute, deepestBoxInFromPath, deepestBoxInToPath} = await commonRouteFinder.findLongestCommonRouteWithWatchers(link)

	if (longestCommonRoute && longestCommonRoute.length > 0) {
		console.log(`bundle ${link.describe()} between ${longestCommonRoute.from.getName()} and ${longestCommonRoute.to.getName()}.`)
		await bundleLinkIntoCommonRoute(link, new CommonRoute(longestCommonRoute.links, longestCommonRoute.from, longestCommonRoute.to))
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
		console.warn(`linkBundler.bundleLinkIntoCommonRoute(link: ${link.describe()}, ..) detected duplicate link`)
		return
	}

	let fromLink: Link = link
	let toLink: Link = link
	if (bundleFromPart && bundleToPart) {
		if (isKnotTemporaryAndWillBeMergedInto(link.to.getTargetNodeId(), commonRoute.to)) {
			toLink = await link.getManagingBoxLinks().addCopy(link)
		} else if (isKnotTemporaryAndWillBeMergedInto(link.from.getTargetNodeId(), commonRoute.from)) {
			fromLink = await link.getManagingBoxLinks().addCopy(link)
		} else if (link.to.isBoxInPath(commonRoute.getEndBox('to'))) {
			toLink = await link.getManagingBoxLinks().addCopy(link)
		} else if (link.from.isBoxInPath(commonRoute.getEndBox('from'))) {
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
	if (bundleFromPart) {
		fromInsertion = await bundleLinkEndIntoCommonRoute(fromLink.to, 'from', commonRoute)
		if (fromInsertion && fromInsertion.addedLink.from.getTargetNodeId() === fromInsertion.insertedNode.getId()) {
			commonRoute.links.push(fromInsertion.addedLink)
		}
	}
	if (bundleToPart) {
		toInsertion = await bundleLinkEndIntoCommonRoute(toLink.from, 'to', commonRoute)
	}
	
	if (bundleFromPart && bundleToPart) {
		const fromNode: AbstractNodeWidget = fromInsertion?.insertedNode?? commonRoute.from
		if (!(fromNode instanceof NodeWidget)) {
			console.warn('bundler.bundleLinkIntoCommonRoute(..) fromKnot is not instanceof NodeWidget')
		}
		const toNode: AbstractNodeWidget = toInsertion?.insertedNode?? commonRoute.to
		if (!(toNode instanceof NodeWidget)) {
			console.warn('bundler.bundleLinkIntoCommonRoute(..) toKnot is not instanceof NodeWidget')
		}
		const fromBundleLinks: Link[] = fromNode.borderingLinks.getIngoing().filter(link => link !== fromLink)
		const toBundleLinks: Link[] = toNode.borderingLinks.getOutgoing().filter(link => link !== toLink)

		await Promise.all([
			...fromBundleLinks.map(async link => {
				if (HighlightPropagatingLink.getBundledWithIds(link).length > 0) {
					return
				}
				HighlightPropagatingLink.addBundledWith(link, toBundleLinks)
				await link.getManagingBox().saveMapData()
			}),
			...toBundleLinks.map(async link => {
				if (HighlightPropagatingLink.getBundledWithIds(link).length > 0) {
					return
				}
				HighlightPropagatingLink.addBundledWith(link, fromBundleLinks)
				await link.getManagingBox().saveMapData()
			})
		])
	}

	const fromKnotIdToMerge: string = fromInsertion?.insertedNode.getId()?? fromLink.from.getTargetNodeId()
	const toKnotIdToMerge: string = toInsertion?.insertedNode.getId()?? toLink.to.getTargetNodeId()
	const fromMergeIntoKnotId: string = fromInsertion ? fromLink.from.getTargetNodeId() : commonRoute.from.getId()
	const toMergeIntoKnotId: string = toInsertion ? toLink.to.getTargetNodeId() : commonRoute.to.getId()
	//await Promise.all([
		await mergeKnotIntoIfPossible(fromKnotIdToMerge, fromMergeIntoKnotId, commonRoute.getEndBox('from'))//,
		await mergeKnotIntoIfPossible(toKnotIdToMerge, toMergeIntoKnotId, commonRoute.getEndBox('to'))
	//])
}

function isKnotTemporaryAndWillBeMergedInto(knotId: string, mergeIntoKnot: AbstractNodeWidget): boolean {
	return mergeIntoKnot instanceof NodeWidget && !!mergeIntoKnot.getParent().nodes.getNodeById(knotId)
}

async function mergeKnotIntoIfPossible(knotId: string, mergeIntoKnotId: string, parent: Box): Promise<void> {
	const knot: NodeWidget|undefined = parent.nodes.getNodeById(knotId)
	if (!knot) {
		return
	}
	const mergeIntoKnot: NodeWidget|undefined = parent.nodes.getNodeById(mergeIntoKnotId)
	if (!mergeIntoKnot) {
		return
	}
	await knotMerger.mergeKnotInto(knot, mergeIntoKnot)
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