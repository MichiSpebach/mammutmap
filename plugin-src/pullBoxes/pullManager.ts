import { Box } from '../../dist/core/box/Box'
import { Link } from '../../dist/core/link/Link'
import { ClientRect } from '../../dist/core/ClientRect'
import { renderManager, RenderPriority } from '../../dist/core/renderEngine/renderManager'
import { LinkRoute } from '../../dist/core/link/LinkRoute'
import { map } from '../../dist/core/Map'

export type PullReason = {reason: Link|Box, route: LinkRoute}

const pulledBoxes: {box: Box, reasons: PullReason[]}[] = []

Box.onFocus.subscribe(async (box: Box) => {
	if (pulledBoxes.find(pulledBox => pulledBox.box === box)) {
		await addFlyToButtonTo(box)
	}
})

Box.onUnfocus.subscribe(async (box: Box) => {
	if (pulledBoxes.find(pulledBox => pulledBox.box === box)) {
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
				releaseAll(),
				map.flyTo(box.getParent().getSrcPath())
			])
		},
		children: 'Fly to'
	}, RenderPriority.RESPONSIVE)
}

async function removeFlyToButtonFrom(box: Box): Promise<void> {
	await renderManager.remove(box.getId()+'-flyToButton', RenderPriority.RESPONSIVE)
}

export async function pull(box: Box, wishRect: ClientRect, reason: PullReason): Promise<void> {
	const pulledBox = pulledBoxes.find(pulledBox => pulledBox.box === box)
	if (pulledBox) {
		pulledBox.reasons.push(reason)
	} else {
		pulledBoxes.push({box, reasons: [reason]})
	}
	await Promise.all([
		box.site.detachToFitClientRect(wishRect, {transitionDurationInMS: 200, renderStylePriority: RenderPriority.RESPONSIVE}),
		renderManager.addStyleTo(box.getBorderId(), {
			boxShadow: 'blueviolet 0 0 10px, blueviolet 0 0 10px',
			transition: 'box-shadow 1s'
		})
	])
}

async function releaseAll(): Promise<void> {
	const pros: Promise<void>[] = []
	for (let i = pulledBoxes.length-1; i >= 0; i--) { // i-- because release(..) removes elements
		pros.push(release(pulledBoxes[i].box, 'all', {transitionDurationInMS: 1000}))
	}
	await Promise.all(pros)
}

export async function releaseForReason(reason: Link|Box): Promise<void> {
	const pros: Promise<void>[] = []
	for (let i = pulledBoxes.length-1; i >= 0; i--) { // i-- because release(..) removes elements
		if (pulledBoxes[i].reasons.find(pullReason => pullReason.reason === reason)) {
			pros.push(release(pulledBoxes[i].box, reason, {transitionDurationInMS: 200}))
		}
	}
	await Promise.all(pros)
}

async function release(box: Box, reason: Link|Box|'all', options: {transitionDurationInMS: number}): Promise<void> {
	const pulledBoxIndex = pulledBoxes.findIndex(pulledBox => pulledBox.box === box)
	const pulledBox = pulledBoxes[pulledBoxIndex]
	if (!pulledBox) {
		return
	}

	const reasons: PullReason[] = []
	for (let i = pulledBox.reasons.length-1; i >= 0; i--) {
		if (reason === 'all' || pulledBox.reasons[i].reason === reason) {
			reasons.push(...pulledBox.reasons.splice(i, 1))
		}
	}
	
	if (pulledBox.reasons.length < 1) {
		pulledBoxes.splice(pulledBoxIndex, 1)
		await box.site.releaseIfDetached({ // await because in some cases important that box is still watched
			transitionDurationInMS: options.transitionDurationInMS,
			renderStylePriority: RenderPriority.RESPONSIVE
		})
		await renderManager.addStyleTo(box.getBorderId(), {
			boxShadow: null
		})
	}
	await Promise.all(reasons.map(reason => reason.route.unwatch()))
}
/*
function getBoxesToPull(route: LinkRoute): Box[] {
	
}*/