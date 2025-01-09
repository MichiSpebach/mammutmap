import { Box } from '../dist/core/box/Box'
import { ClientRect } from '../dist/core/ClientRect'
import { Link } from '../dist/core/link/Link'
import { LinkEnd } from '../dist/core/link/LinkEnd'
import { NodeWidget } from '../dist/core/node/NodeWidget'
import { BoxWatcher } from '../dist/core/box/BoxWatcher'
import { ClientPosition } from '../dist/core/shape/ClientPosition'
import { AbstractNodeWidget } from '../dist/core/AbstractNodeWidget'
import * as pullManager from './pullBoxes/pullManager'
import { map } from '../dist/core/Map'

Link.onSelect.subscribe(async (link: Link) => {
	await Promise.all([
		pullInLinkEndTargetIfNecessary(link.from),
		pullInLinkEndTargetIfNecessary(link.to)
	])
})

Link.onDeselect.subscribe(async (link: Link) => await pullManager.releaseForLink(link))

async function pullInLinkEndTargetIfNecessary(linkEnd: LinkEnd): Promise<void> {
	if (await isLinkEndOutsideScreen(linkEnd)) {
		const pullPosition: Promise<ClientPosition> = calculatePullPosition(linkEnd)
		const target: {box: Box, watcher: BoxWatcher} = await getTargetBoxAndRenderIfNecessary(linkEnd)
		if (target.box.isAncestorOf(linkEnd.getOtherEnd().getDeepestRenderedWayPoint().linkable)) {
			console.info('pullBoxes: target box to pull is an ancestor (outer box of the same path)')
			return
		}
		await pullManager.pull(target.box, createPullRect(await pullPosition), {link: linkEnd.getReferenceLink(), watcher: target.watcher})
	} else if (!await isTargetRenderedAndLargeEnough(linkEnd)) {
		const target: {box: Box, watcher: BoxWatcher} = await getTargetBoxAndRenderIfNecessary(linkEnd)
		const targetBoxRect: ClientRect = await target.box.getClientRect()
		let pullRect: ClientRect = createPullRect(targetBoxRect.getMidPosition())
		if (pullRect.width < targetBoxRect.width || pullRect.height < targetBoxRect.height) {
			pullRect = targetBoxRect
		}
		await pullManager.pull(target.box, pullRect, {link: linkEnd.getReferenceLink(), watcher: target.watcher})
	}
}

async function isLinkEndOutsideScreen(linkEnd: LinkEnd): Promise<boolean> {
	const position: ClientPosition = await linkEnd.getRenderPositionInClientCoords()
	const rect: ClientRect = await getIntersectionRect()
	return !rect.isPositionInside(position)
}

async function isTargetBoxOutsideScreen(linkEnd: LinkEnd): Promise<boolean> {
	const target: Box|NodeWidget = linkEnd.getDeepestRenderedWayPoint().linkable
	const targetBox: Box = target instanceof Box ? target : target.getParent()
	const mapClientRect: ClientRect = await linkEnd.getManagingBox().context.getMapClientRect()
	const targetBoxRect: ClientRect = await targetBox.getClientRect()
	return !targetBoxRect.isInsideOrEqual(mapClientRect) && !targetBoxRect.isOverlappingWith(mapClientRect)
}

async function isTargetRenderedAndLargeEnough(linkEnd: LinkEnd): Promise<boolean> {
	const target: Box|NodeWidget = linkEnd.getDeepestRenderedWayPoint().linkable
	if (target.getId() !== linkEnd.getTargetNodeId()) {
		return false
	}
	const targetBox: Box = target instanceof Box ? target : target.getParent()
	const rect: ClientRect = await targetBox.getClientRect()
	return rect.width + rect.height > 200
}

async function getTargetBoxAndRenderIfNecessary(linkEnd: LinkEnd): Promise<{box: Box, watcher: BoxWatcher}> {
	const target: {node: AbstractNodeWidget, watcher: BoxWatcher} = await linkEnd.getTargetAndRenderIfNecessary()
	const box: Box = target.node instanceof Box ? target.node : target.node.getParent() as Box
	return {box, watcher: target.watcher}
}

function createPullRect(midPosition: ClientPosition): ClientRect {
	return new ClientRect(midPosition.x-100, midPosition.y-50, 200, 100)
}

async function calculatePullPosition(linkEnd: LinkEnd): Promise<ClientPosition> {
	const link: Link = linkEnd.getReferenceLink()
	const linkLine = await link.getLineInClientCoords()
	const intersectionRect: ClientRect = await getIntersectionRect()
	const intersections: ClientPosition[] = intersectionRect.calculateIntersectionsWithLine(linkLine)
	if (intersections.length < 1) {
		console.warn('pullBoxes: intersections.length < 1')
		intersections.push(intersectionRect.getMidPosition())
	}
	let intersection: ClientPosition = intersections[0]
	if (intersections.length > 1) {
		const linkEndPosition: ClientPosition = await linkEnd.getRenderPositionInClientCoords()
		for (let i = 1; i < intersections.length; i++) {
			if (intersections[i].calculateDistanceTo(linkEndPosition) < intersection.calculateDistanceTo(linkEndPosition)) {
				intersection = intersections[i]
			}
		}
	}
	return intersection
}

async function getIntersectionRect(): Promise<ClientRect> {
	if (!map) {
		throw new Error('pullBoxes: !map')
	}
	const mapRect: ClientRect = await map.getRootFolder().context.getMapClientRect()
	return new ClientRect(mapRect.x+120, mapRect.y+60, mapRect.width-240, mapRect.height-140)
}