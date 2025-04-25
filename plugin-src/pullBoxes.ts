import { Box } from '../dist/core/box/Box'
import { ClientRect } from '../dist/core/ClientRect'
import { Link } from '../dist/core/link/Link'
import { LinkEnd } from '../dist/core/link/LinkEnd'
import { ClientPosition } from '../dist/core/shape/ClientPosition'
import { AbstractNodeWidget } from '../dist/core/AbstractNodeWidget'
import { map } from '../dist/core/Map'
import { LinkRoute } from '../dist/core/link/LinkRoute'
import { PullReason } from './pullBoxes/PulledBox'
import { DebugWidget } from './pullBoxes/DebugWidget'
import { PulledBoxes } from './pullBoxes/PulledBoxes'
import { renderManager, RenderPriority } from '../dist/core/renderEngine/renderManager'
import { Line } from '../dist/core/shape/Line'

const pulledBoxes = new PulledBoxes()

//DebugWidget.newAndRenderFor(pulledBoxes)

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
	await pulledBoxes.releaseForReason(link)
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
	await pulledBoxes.releaseForReason(box)
})

Box.onFocus.subscribe(async (box: Box) => {
	if (pulledBoxes.find(box)) {
		await addFlyToButtonTo(box)
	}
})

Box.onUnfocus.subscribe(async (box: Box) => {
	if (pulledBoxes.find(box)) {
		await removeFlyToButtonFrom(box)
	}
})

async function addFlyToButtonTo(box: Box): Promise<void> {
	await renderManager.addElementTo(box.getId(), {
		type: 'button',
		id: box.getId()+'-flyToButton',
		style: {position: 'absolute', top: '4px', right: '60px', cursor: 'pointer'},
		onclick: async () => {
			if (!map) {
				console.warn(`pullBoxes: !map`)
				return
			}
			await Promise.all([
				removeFlyToButtonFrom(box),
				pulledBoxes.releaseAll(),
				map.flyTo(box.getParent().getSrcPath())
			])
		},
		children: 'Fly to'
	}, RenderPriority.RESPONSIVE)
}

async function removeFlyToButtonFrom(box: Box): Promise<void> {
	await renderManager.remove(box.getId()+'-flyToButton', RenderPriority.RESPONSIVE)
}

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
		//await pullInLinkEndTargetIfNecessary(route.links[0].from, originBox, {reason, route})
		//await pullInBoxIfNecessary(originBox, {reason, route})
		await pullInBoxPathIfNecessary(originBox, {reason, route})
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
		//await pullInLinkEndTargetIfNecessary(route.links[route.links.length-1].to, destinationBox, {reason, route})
		//await pullInBoxIfNecessary(destinationBox, {reason, route})
		await pullInBoxPathIfNecessary(destinationBox, {reason, route})
	}))
}

async function pullInBoxPathIfNecessary(box: Box, reason: PullReason): Promise<void> {
	if (await shouldNotPullBox(box)) {
		await reason.route.unwatch()
		return
	}

	const path: Box[] = [box]
	while (!path[0].isRoot()) {
		if (await shouldNotPullBox(path[0].getParent())) {
			break
		}
		path.unshift(path[0].getParent())
	}

	const route: LinkRoute = reason.route
	
	let linkEndAtBox: LinkEnd
	let pullDirection: 'from'|'to'
	if (route.links[0].from.getDeepestRenderedWayPoint().linkable === box) {
		linkEndAtBox = route.links[0].from
		pullDirection = 'from'
	} else if (route.links[route.links.length-1].to.getDeepestRenderedWayPoint().linkable === box) {
		linkEndAtBox = route.links[route.links.length-1].to
		pullDirection = 'to'
	} else {
		console.warn(`pullBoxes.pullInBoxPathIfNecessary(box ${box.getSrcPath()}, reason) box is not an end of reason.route`)
		await route.unwatch()
		return
	}

	let pullPosition: ClientPosition // TODO: hack only, improve
	if (await isLinkEndOutsideScreen(linkEndAtBox)) {
		pullPosition = await calculatePullPositionOfRoute(route, pullDirection)
	} else {
		pullPosition = (await box.getClientRect()).getMidPosition()
		const intersectionRect: ClientRect = await getIntersectionRect()
		if (!intersectionRect.isPositionInside(pullPosition)) {
			const position: ClientPosition|undefined = await calculatePullPositionOfLink(linkEndAtBox, {elongationInPixels: 10000})
			if (position) {
				pullPosition = position
			} else {
				console.warn(`pullBoxes.pullInBoxPathIfNecessary(box ${box.getSrcPath()}, reason)`)
			}
		}
	}

	if (!pullingInReasonsInProgress.includes(reason.reason)) {
		// already deselected in meantime
		await reason.route.unwatch()
		return
	}
	await pulledBoxes.pullPath(path, createPullRect(pullPosition), reason)
}

async function shouldNotPullBox(box: Box): Promise<boolean> {
	if (await box.isZoomedIn()) {
		return true
	}
	const boxRect: ClientRect = await box.getClientRect()
	const mapRect: ClientRect = await getUncoveredMapClientRect()
	return boxRect.isInsideOrEqual(mapRect) && (await box.getClientRect()).getArea() > 100*100
}

async function isLinkEndOutsideScreen(linkEnd: LinkEnd): Promise<boolean> {
	const position: ClientPosition = await linkEnd.getRenderPositionInClientCoords()
	const rect: ClientRect = await getIntersectionRect()
	return !rect.isPositionInside(position)
}

function createPullRect(midPosition: ClientPosition): ClientRect {
	return new ClientRect(midPosition.x-100, midPosition.y-50, 200, 100)
}

async function calculatePullPositionOfRoute(linkRoute: LinkRoute, direction: 'from'|'to'): Promise<ClientPosition> {
	const startIndex: number = direction === 'to' ? 0 : linkRoute.links.length-1
	const increment: number = direction === 'to' ? 1 : -1
	for (let i = startIndex; i < linkRoute.links.length && i >= 0; i += increment) {
		const link: Link = linkRoute.links[i]
		const pullPosition: ClientPosition|undefined = await calculatePullPositionOfLink(link[direction])
		if (pullPosition) {
			return pullPosition
		}
	}
	console.warn(`pullBoxes: intersections.length < 1 for linkRoute [${linkRoute.nodes.map(node => node.node.getName())}]`)
	return (await getIntersectionRect()).getMidPosition()
}

async function calculatePullPositionOfLink(linkEnd: LinkEnd, options?: {elongationInPixels?: number}): Promise<ClientPosition|undefined> {
	const linkEndPosition: Promise<ClientPosition> = linkEnd.getRenderPositionInClientCoords()
	const otherLinkEndPosition: Promise<ClientPosition> = linkEnd.getOtherEnd().getRenderPositionInClientCoords()
	let linkLine = new Line(await linkEndPosition, await otherLinkEndPosition)
	if (options?.elongationInPixels) {
		linkLine = linkLine.elongate(options.elongationInPixels)
	}
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
	const mapRect: ClientRect = await getUncoveredMapClientRect()
	return new ClientRect(mapRect.x+120, mapRect.y+60, mapRect.width-240, mapRect.height-140)
}

async function getUncoveredMapClientRect(): Promise<ClientRect> {
	if (!map) {
		throw new Error('pullBoxes: !map, no folder opened')
	}
	return await map.getUncoveredMapClientRect()
}