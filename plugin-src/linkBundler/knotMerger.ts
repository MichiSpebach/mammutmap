/**
 * pluginFacade not used in imports because
 * some imports could not be resolved when importing from '../dist/pluginFacade' and cause:
 * "TypeError: Class extends value undefined is not a constructor or null"
 * TODO fix this!
 */
import { Link } from '../../dist/core/link/Link'
import { LinkEnd } from '../../dist/core/link/LinkEnd'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { ClientPosition } from '../../dist/core/shape/ClientPosition'
import { HighlightPropagatingLink } from './HighlightPropagatingLink'

export async function mergeKnot(knot: NodeWidget): Promise<void> {
	const otherKnots: NodeWidget[] = knot.getParent().nodes.getNodes()
	const mergeIntoKnot: NodeWidget|undefined = otherKnots.find(otherKnot => knot !== otherKnot && canKnotsBeMerged(knot, otherKnot))
	if (mergeIntoKnot) {
		await mergeKnotInto(knot, mergeIntoKnot)
	}
}

export async function mergeKnotInto(knot: NodeWidget, mergeIntoKnot: NodeWidget): Promise<void> {
	const linkBetweenKnots: Link|undefined = getLinkBetween(knot, mergeIntoKnot)
	if (!linkBetweenKnots) {
		console.warn(`knotMerger.mergeKnotInto(knot: '${knot.getName()}', mergeIntoKnot: '${mergeIntoKnot}') there is no link between knot and mergeIntoKnot`)
		return
	}

	const entangledLinks: Link[] = await HighlightPropagatingLink.getEntangledLinks(linkBetweenKnots, linkBetweenKnots.from.getTargetNodeId() === mergeIntoKnot.getId() ? 'from' : 'to')
	await pushEntanglementsOfLinkInDirection(linkBetweenKnots, entangledLinks, knot)
	entangledLinks.map(async (entangledLink: Link) => {
		HighlightPropagatingLink.removeBundledWithId(entangledLink, linkBetweenKnots.getId())
		await entangledLink.getManagingBox().saveMapData()
	})
	await linkBetweenKnots.getManagingBoxLinks().removeLink(linkBetweenKnots)

	const newPosition: ClientPosition = (await mergeIntoKnot.getClientShape()).getMidPosition()
	const pros: Promise<void>[] = knot.borderingLinks.getAllEnds().map(async (end: LinkEnd) => {
		const link: Link = end.getReferenceLink()
		const otherEnd: 'from'|'to' = link.from === end ? 'to' : 'from'
		const mergeIntoLink: Link|undefined = getLinkBetweenDirected(mergeIntoKnot, end.getOtherEnd().getTargetNodeId(), otherEnd)
		if (mergeIntoLink) {
			await Promise.all([
				mergeLinkInto(link, mergeIntoLink),
				link.getManagingBoxLinks().removeLink(link)
			])
		} else {
			await end.dragAndDrop({dropTarget: mergeIntoKnot, clientPosition: newPosition})
		}
	})
	await Promise.all(pros)
	await knot.getParent().nodes.remove(knot, {mode: 'reorder bordering links'})
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

async function pushEntanglementsOfLinkInDirection(link: Link, linkEntanglements: Link[], knotInDirection: NodeWidget): Promise<void> {
	if (link.from.getTargetNodeId() === knotInDirection.getId()) {
		await Promise.all(knotInDirection.borderingLinks.getIngoing().map(mergeIntoLink => pushEntanglementsOfLinkIntoOtherLink({link, linkEntanglements, otherLink: mergeIntoLink})))
		return
	}
	if (link.to.getTargetNodeId() === knotInDirection.getId()) {
		await Promise.all(knotInDirection.borderingLinks.getOutgoing().map((mergeIntoLink: Link) => pushEntanglementsOfLinkIntoOtherLink({link, linkEntanglements, otherLink: mergeIntoLink})))
		return
	}
	console.warn(`knotMerger.pushEntanglementsOfLinkInDirection(..) link does not end with knotInDirection`)
}

async function pushEntanglementsOfLinkIntoOtherLink(options: {link: Link, linkEntanglements: Link[], otherLink: Link}): Promise<void> {
	await Promise.all([
		mergeLinkInto(options.link, options.otherLink),
		options.linkEntanglements.map((linkEntanglement: Link) => HighlightPropagatingLink.addBundledWithIds(linkEntanglement, [options.otherLink.getId()]))
	])
}

async function mergeLinkInto(link: Link, mergeIntoLink: Link): Promise<void> {
	HighlightPropagatingLink.addBundledWithIds(mergeIntoLink, HighlightPropagatingLink.getBundledWithIds(link))
	await mergeIntoLink.getManagingBox().saveMapData()
}