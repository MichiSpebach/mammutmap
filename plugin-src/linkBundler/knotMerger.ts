/**
 * pluginFacade not used in imports because
 * some imports could not be resolved when importing from '../dist/pluginFacade' and cause:
 * "TypeError: Class extends value undefined is not a constructor or null"
 * TODO fix this!
 */
import { BoxWatcher } from '../../src/core/box/BoxWatcher'
import { Link } from '../../src/core/link/Link'
import { LinkEnd } from '../../src/core/link/LinkEnd'
import { NodeWidget } from '../../src/core/node/NodeWidget'
import { ClientPosition } from '../../src/core/shape/ClientPosition'
import { HighlightPropagatingLink } from './HighlightPropagatingLink'
import { RouteTree } from './RouteTree'

export async function mergeKnot(knot: NodeWidget): Promise<{mergedIntoLinks: Link[]}|void> {
	const otherKnots: NodeWidget[] = knot.getParent().nodes.getNodes()
	const mergeIntoKnot: NodeWidget|undefined = otherKnots.find(otherKnot => knot !== otherKnot && canKnotsBeMerged(knot, otherKnot))
	if (mergeIntoKnot) {
		return await mergeKnotInto(knot, mergeIntoKnot)
	}
}

export async function mergeKnotInto(knot: NodeWidget, mergeIntoKnot: NodeWidget, options?: {entangleLinks?: boolean}): Promise<{mergedIntoLinks: Link[]}|void> {
	const linkBetweenKnots: Link|undefined = getLinkBetween(knot, mergeIntoKnot)
	if (!linkBetweenKnots) {
		console.warn(`knotMerger.mergeKnotInto(knot: '${knot.getName()}', mergeIntoKnot: '${mergeIntoKnot.getName()}') there is no link between knot and mergeIntoKnot`)
		return
	}
	
	let entanglementLinkTowardsCenter: Link|undefined = undefined
	let entanglementRouteTreeSearchDirection: 'from'|'to'|undefined = undefined
	if (options?.entangleLinks) {
		const directions: {knotAwayFromCenter: NodeWidget, knotTowardsCenter: NodeWidget, linkTowardsCenter: Link} | undefined = getDirectionsRegardingRouteTree(knot, mergeIntoKnot)
		if (!directions) {
			console.warn(`knotMerger.mergeKnotInto(knot: '${knot.getName()}', mergeIntoKnot: '${mergeIntoKnot.getName()}') failed to getDirectionsRegardingRouteTree(knot, mergeIntoKnot)`)
			return
		}
		entanglementLinkTowardsCenter = directions.linkTowardsCenter
		entanglementRouteTreeSearchDirection = linkBetweenKnots.from.getTargetNodeId() === directions.knotTowardsCenter.getId() ? 'from' : 'to'
		await moveEntanglementsOfLinkInDirection(linkBetweenKnots, entanglementRouteTreeSearchDirection, directions.knotAwayFromCenter)
	}

	const newPosition: ClientPosition = (await mergeIntoKnot.getClientShape()).getMidPosition()
	const mergedIntoLinks: Link[] = []
	await Promise.all(knot.borderingLinks.getAllEnds().map(async (end: LinkEnd) => {
		const link: Link = end.getReferenceLink()
		if (link === linkBetweenKnots || link === entanglementLinkTowardsCenter) {
			return
		}
		const otherEnd: 'from'|'to' = link.from === end ? 'to' : 'from'
		const mergeIntoLink: Link|undefined = getLinkBetweenDirected(mergeIntoKnot, end.getOtherEnd().getTargetNodeId(), otherEnd)
		if (mergeIntoLink) {
			await mergeLinkIntoAndRemove(link, entanglementRouteTreeSearchDirection, mergeIntoLink)
			mergedIntoLinks.push(mergeIntoLink)
		} else {
			await end.dragAndDrop({dropTarget: mergeIntoKnot, clientPosition: newPosition})
		}
	}))
	if (entanglementLinkTowardsCenter) {
		await entanglementLinkTowardsCenter[entanglementRouteTreeSearchDirection === 'from' ? 'to' : 'from'].dragAndDrop({dropTarget: mergeIntoKnot, clientPosition: newPosition})
	}

	await linkBetweenKnots.getManagingBoxLinks().removeLink(linkBetweenKnots)
	await knot.getParent().nodes.remove(knot, {mode: 'reorder bordering links'})
	return {mergedIntoLinks}
}

function canKnotsBeMerged(knot: NodeWidget, otherKnot: NodeWidget): boolean {
	return knot.borderingLinks.getAll().some((link: Link) => 
		link.from.getTargetNodeId() === otherKnot.getId() ||
		link.to.getTargetNodeId() === otherKnot.getId()
	)
}

function getLinkBetween(node: NodeWidget, otherNode: NodeWidget): Link|undefined {
	const links: Link[] = node.borderingLinks.getAll().filter((link: Link) => link.from.getTargetNodeId() === otherNode.getId() || link.to.getTargetNodeId() === otherNode.getId())
	if (links.length > 1) {
		console.warn(`knotMerger.getLinksBetween(..) there are more than one link between node '${node.getName()}' and otherNode '${otherNode.getName()}'`)
	}
	return links[0]
}

function getLinkBetweenDirected(knot: NodeWidget, targetNodeId: string, linkEnd: 'from'|'to'): Link|undefined {
	return knot.borderingLinks.getAll().find((link: Link) => link[linkEnd].getTargetNodeId() === targetNodeId)
}

/** TODO: does not work for all cases, add direction mapping to NodeWidget, Link or LinkEnd */
function getDirectionsRegardingRouteTree(knot: NodeWidget, otherKnot: NodeWidget): {
	knotAwayFromCenter: NodeWidget, knotTowardsCenter: NodeWidget, linkTowardsCenter: Link
} | undefined {
	const linkTowardsCenter: Link|undefined = getLinkTowardsCenter(knot)
	const otherLinkTowardsCenter: Link|undefined = getLinkTowardsCenter(otherKnot)
	if (!linkTowardsCenter ||!otherLinkTowardsCenter) {
		return undefined
	}
	const linkManagingBoxPathLength: number = linkTowardsCenter.getManagingBox().getSrcPath().length
	const otherLinkManagingBoxPathLength: number = otherLinkTowardsCenter.getManagingBox().getSrcPath().length
	if (linkManagingBoxPathLength === otherLinkManagingBoxPathLength) {
		return undefined
	}
	return linkManagingBoxPathLength > otherLinkManagingBoxPathLength
		? {knotAwayFromCenter: knot, knotTowardsCenter: otherKnot, linkTowardsCenter: otherLinkTowardsCenter}
		: {knotAwayFromCenter: otherKnot, knotTowardsCenter: knot, linkTowardsCenter}
}

function getLinkTowardsCenter(knot: NodeWidget): Link|undefined {
	let linkTowardsCenter: Link|undefined
	let minManagingBoxPathLength: number = Number.MAX_VALUE
	for (const link of knot.borderingLinks.getAll()) {
		if (link.getManagingBox().getSrcPath().length < minManagingBoxPathLength) {
			linkTowardsCenter = link
			minManagingBoxPathLength = link.getManagingBox().getSrcPath().length
		}
	}
	if (!linkTowardsCenter) {
		console.warn(`knotMerger::getLinkTowardsCenter(knot: '${knot.getName()}') knot has no bordering links.`)
	}
	return linkTowardsCenter
}

async function moveEntanglementsOfLinkInDirection(link: Link, routeTreeSearchDirection: 'from'|'to', knotInDirection: NodeWidget): Promise<void> {
	const entangledLinks: {links: Link[], watchers: BoxWatcher[]} = await new RouteTree(link, routeTreeSearchDirection).getEntangledLinks()
	await copyEntanglementsOfLinkInDirection(link, entangledLinks.links, knotInDirection)
	await Promise.all(entangledLinks.links.map(async (entangledLink: Link) => {
		HighlightPropagatingLink.removeBundledWithId(entangledLink, link.getId())
		HighlightPropagatingLink.removeBundledWithId(link, entangledLink.getId())
		await entangledLink.getManagingBox().saveMapData()
	}))
	await link.getManagingBox().saveMapData()
	entangledLinks.watchers.forEach(watcher => watcher.unwatch())
}

async function copyEntanglementsOfLinkInDirection(link: Link, linkEntanglements: Link[], knotInDirection: NodeWidget): Promise<void> {
	if (link.from.getTargetNodeId() === knotInDirection.getId()) {
		await Promise.all(knotInDirection.borderingLinks.getIngoing().map((copyInto: Link) => copyEntanglementsOfLinkInto({link, linkEntanglements, copyInto})))
		return
	}
	if (link.to.getTargetNodeId() === knotInDirection.getId()) {
		await Promise.all(knotInDirection.borderingLinks.getOutgoing().map((copyInto: Link) => copyEntanglementsOfLinkInto({link, linkEntanglements, copyInto})))
		return
	}
	console.warn(`knotMerger.copyEntanglementsOfLinkInDirection(..) link does not end with knotInDirection`)
}

async function copyEntanglementsOfLinkInto(options: {link: Link, linkEntanglements: Link[], copyInto: Link}): Promise<void> {
	if (HighlightPropagatingLink.getBundledWithIds(options.copyInto).length > 0) {
		return
	}
	HighlightPropagatingLink.addBundledWithIds(options.copyInto, HighlightPropagatingLink.getBundledWithIds(options.link))
	await Promise.all([
		options.linkEntanglements.map((entangledLink: Link) => {
			HighlightPropagatingLink.addBundledWithIds(entangledLink, [options.copyInto.getId()])
			entangledLink.getManagingBox().saveMapData() // entangledLink is saved anyway in moveEntanglementsOfLinkInDirection(..) but is cleaner and more stable if surrounding implementation is changed or method is reused
		}),
		options.copyInto.getManagingBox().saveMapData()
	])
}

async function mergeLinkIntoAndRemove(link: Link, entangleLinksRouteTreeSearchDirection: 'from'|'to'|undefined, mergeIntoLink: Link, ): Promise<void> {
	HighlightPropagatingLink.addRoutes(mergeIntoLink, HighlightPropagatingLink.getRouteIds(link))
	for (const tag of link.getTags()) {
		if (!mergeIntoLink.includesTag(tag)) {
			mergeIntoLink.addTag(tag)
		}
	}

	if (entangleLinksRouteTreeSearchDirection) {
		const entangledLinks: {links: Link[], watchers: BoxWatcher[]} = await new RouteTree(link, entangleLinksRouteTreeSearchDirection).getEntangledLinks()
		HighlightPropagatingLink.addBundledWithIds(mergeIntoLink, HighlightPropagatingLink.getBundledWithIds(link))
		await Promise.all([
			entangledLinks.links.map(async entangledLink => {
				HighlightPropagatingLink.addBundledWith(entangledLink, [mergeIntoLink])
				HighlightPropagatingLink.removeBundledWithId(entangledLink, link.getId())
				//HighlightPropagatingLink.replaceBundledWithId(link.getEntanglements) // TODO?
				await entangledLink.getManagingBox().saveMapData()
			})
		])
		entangledLinks.watchers.forEach(watcher => watcher.unwatch())
	}

	await Promise.all([
		mergeIntoLink.getManagingBox().saveMapData(),
		link.getManagingBoxLinks().removeLink(link)
	])
}