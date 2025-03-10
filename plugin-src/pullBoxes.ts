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
import { LinkRoute } from '../dist/core/link/LinkRoute'
import { PullReason } from './pullBoxes/pullManager'

const pullingInReasonsInProgress: (Link|Box)[] = []

Link.onSelect.subscribe(async (link: Link) => {
	pullingInReasonsInProgress.push(link)
	await Promise.all([
		pullInOriginsIfNecessary(link, link),
		pullInDestinationsIfNecessary(link, link)
	])
	removePullingInReasonIfInProgress(link)
})

Link.onDeselect.subscribe(async (link: Link) => {
	removePullingInReasonIfInProgress(link)
	await pullManager.releaseForReason(link)
})

Box.onSelect.subscribe(async (box: Box) => {
	pullingInReasonsInProgress.push(box)
	await Promise.all([
		...box.borderingLinks.getIngoing().map(link => pullInOriginsIfNecessary(link, box)),
		...box.borderingLinks.getOutgoing().map(link => pullInDestinationsIfNecessary(link, box))
	])
	removePullingInReasonIfInProgress(box)
})

Box.onDeselect.subscribe(async (box: Box) => {
	removePullingInReasonIfInProgress(box)
	await pullManager.releaseForReason(box)
})

function removePullingInReasonIfInProgress(removePullingInReason: Link|Box): void {
	const index: number = pullingInReasonsInProgress.indexOf(removePullingInReason)
	if (index > -1) {
		pullingInReasonsInProgress.splice(index, 1)
	}
}

async function pullInOriginsIfNecessary(link: Link, reason: Link|Box): Promise<void> {
	const routeIds: string[]|undefined = link.getData().routes
	const originRoutes: LinkRoute[] = routeIds && routeIds.length > 0
		? routeIds.map(routeId => new LinkRoute(routeId, link))
		: [new LinkRoute(undefined, link)]
	const originBoxes: Box[] = []
	await Promise.all(originRoutes.map(async route => {
		const origin: AbstractNodeWidget = await route.followOriginAndWatch()
		const originBox: Box = origin instanceof Box ? origin : origin.getParent() as Box
		if (originBoxes.includes(originBox)) {
			// prevents pulling same box multiple times what would lead to "warning: pullBoxes: intersections.length < 1"
			await route.unwatch()
			return
		}
		originBoxes.push(originBox)
		await pullInLinkEndTargetIfNecessary(route.links[0].from, originBox, {reason, route})
	}))
}

async function pullInDestinationsIfNecessary(link: Link, reason: Link|Box): Promise<void> {
	const routeIds: string[]|undefined = link.getData().routes
	const destinationRoutes: LinkRoute[] = routeIds && routeIds.length > 0
		? routeIds.map(routeId => new LinkRoute(routeId, link))
		: [new LinkRoute(undefined, link)]
	const destinationBoxes: Box[] = []
	await Promise.all(destinationRoutes.map(async route => {
		const destination: AbstractNodeWidget = await route.followDestinationAndWatch()
		const destinationBox: Box = destination instanceof Box ? destination : destination.getParent() as Box
		if (destinationBoxes.includes(destinationBox)) {
			// prevents pulling same box multiple times what would lead to "warning: pullBoxes: intersections.length < 1"
			await route.unwatch()
			return
		}
		destinationBoxes.push(destinationBox)
		await pullInLinkEndTargetIfNecessary(route.links[route.links.length-1].to, destinationBox, {reason, route})
	}))
}

async function pullInLinkEndTargetIfNecessary(linkEnd: LinkEnd, targetBox: Box, reason: PullReason): Promise<void> {
	if (await isLinkEndOutsideScreen(linkEnd)) {
		const pullPosition: ClientPosition = await calculatePullPositionOfRoute(reason.route, linkEnd === linkEnd.getReferenceLink().to ? 'to' : 'from')
		if (targetBox.isAncestorOf(linkEnd.getOtherEnd().getDeepestRenderedWayPoint().linkable)) {
			console.info('pullBoxes: target box to pull is an ancestor (outer box of the same path)')
			return
		}
		if (pullingInReasonsInProgress.includes(reason.reason)) {
			await pullManager.pull(targetBox, createPullRect(pullPosition), reason)
		} else {
			// already deselected in meantime
			await reason.route.unwatch()
		}
	} else if (!await isTargetRenderedAndLargeEnough(linkEnd)) {
		const targetBoxRect: ClientRect = await targetBox.getClientRect()
		let pullRect: ClientRect = createPullRect(targetBoxRect.getMidPosition())
		if (pullRect.width < targetBoxRect.width || pullRect.height < targetBoxRect.height) {
			pullRect = targetBoxRect
		}
		if (pullingInReasonsInProgress.includes(reason.reason)) {
			await pullManager.pull(targetBox, pullRect, reason)
		} else {
			// already deselected in meantime
			await reason.route.unwatch()
		}
	} else {
		await reason.route.unwatch()
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

async function calculatePullPositionOfRoute(linkRoute: LinkRoute, direction: 'from'|'to'): Promise<ClientPosition> {
	for (const link of linkRoute.links) {
		const pullPosition: ClientPosition|undefined = await calculatePullPositionOfLink(link[direction])
		if (pullPosition) {
			return pullPosition
		}
	}
	console.warn('pullBoxes: intersections.length < 1')
	return (await getIntersectionRect()).getMidPosition()
}

async function calculatePullPositionOfLink(linkEnd: LinkEnd): Promise<ClientPosition|undefined> {
	const linkEndPosition: Promise<ClientPosition> = linkEnd.getRenderPositionInClientCoords()
	const otherLinkEndPosition: Promise<ClientPosition> = linkEnd.getOtherEnd().getRenderPositionInClientCoords()
	const linkLine = {from: await linkEndPosition, to: await otherLinkEndPosition}
	const intersectionRect: ClientRect = await getIntersectionRect()
	const intersections: ClientPosition[] = intersectionRect.calculateIntersectionsWithLine(linkLine)
	if (intersections.length < 1) {
		return undefined
	}
	let intersection: ClientPosition = intersections[0]
	if (intersections.length > 1) {
		for (let i = 1; i < intersections.length; i++) {
			if (intersections[i].calculateDistanceTo(await linkEndPosition) < intersection.calculateDistanceTo(await linkEndPosition)) {
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