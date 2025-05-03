import { Box } from '../dist/core/box/Box'
import { Link } from '../dist/core/link/Link'
import { AbstractNodeWidget } from '../dist/core/AbstractNodeWidget'
import { map } from '../dist/core/Map'
import { LinkRoute } from '../dist/core/link/LinkRoute'
import { DebugWidget } from './pullBoxes/DebugWidget'
import { PulledBoxes } from './pullBoxes/PulledBoxes'
import { renderManager, RenderPriority } from '../dist/core/renderEngine/renderManager'
import { PullReason } from './pullBoxes/PullReason'

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
		await pullInBoxPathIfNecessary(originBox, new PullReason(reason, route))
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
		await pullInBoxPathIfNecessary(destinationBox, new PullReason(reason, route))
	}))
}

async function pullInBoxPathIfNecessary(box: Box, reason: PullReason): Promise<void> {
	const path: Box[] = []
	while (!box.isRoot()) {
		path.unshift(box)
		box = box.getParent()
	}

	let pulled: boolean = false
	for (const box of path) {
		if (await pulledBoxes.pullBoxIfNecessary(box, reason)) {
			pulled = true
		}
	}

	if (!pulled || !pullingInReasonsInProgress.includes(reason.reason)/*already deselected in meantime*/) {
		await reason.route.unwatch()
	}
}