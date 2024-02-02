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

export async function mergeKnot(knot: NodeWidget): Promise<void> {
	const otherKnots: NodeWidget[] = knot.getParent().nodes.getNodes()
	const mergeIntoKnot: NodeWidget|undefined = otherKnots.find(otherKnot => knot !== otherKnot && canKnotsBeMerged(knot, otherKnot))
	if (!mergeIntoKnot) {
		//console.warn(`failed to merge knot '${knot.getName()}'`)
		return
	}

	const newPosition: ClientPosition = (await mergeIntoKnot.getClientShape()).getMidPosition()
	const pros: Promise<void>[] = knot.borderingLinks.getAllEnds().map((end: LinkEnd) => {
		const link: Link = end.getReferenceLink()
		if (isLinkConnectedToKnot(link, mergeIntoKnot)) {
			return link.getManagingBoxLinks().removeLink(link)
		} else {
			return end.dragAndDrop({dropTarget: mergeIntoKnot, clientPosition: newPosition})
		}
	})
	await Promise.all(pros)
	await knot.getParent().nodes.remove(knot, {mode: 'reorder bordering links'})
}

function canKnotsBeMerged(knot: NodeWidget, otherKnot: NodeWidget): boolean {
	return knot.borderingLinks.getAll().some((link: Link) => 
		link.getData().from.path.at(-1)?.boxId === otherKnot.getId() ||
		link.getData().to.path.at(-1)?.boxId === otherKnot.getId()
	)
}

function isLinkConnectedToKnot(link: Link, knot: NodeWidget): boolean {
	return link.getData().from.path.at(-1)?.boxId === knot.getId()
		|| link.getData().to.path.at(-1)?.boxId === knot.getId()
}