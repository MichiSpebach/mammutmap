import { Box } from '../../dist/core/box/Box'
import { Link } from '../../dist/core/link/Link'
import { ClientRect } from '../../dist/core/ClientRect'
import { renderManager, RenderPriority } from '../../dist/core/renderEngine/renderManager'
import { map } from '../../dist/core/Map'
import { PulledBox, PullReason } from './PulledBox'

const pulledBoxes: PulledBox[] = []

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
	const pulledBox: PulledBox|undefined = pulledBoxes.find(pulledBox => pulledBox.box === box)
	if (pulledBox) {
		await pulledBox.addReasonAndUpdatePull(reason, wishRect)
	} else {
		const boxPulling: {pulledBox: PulledBox, pulling: Promise<void>} = PulledBox.newAndPull(box, [reason], wishRect)
		pulledBoxes.push(boxPulling.pulledBox)
		await boxPulling.pulling
	}
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
	const pulledBox: PulledBox|undefined = pulledBoxes.find(pulledBox => pulledBox.box === box)
	if (!pulledBox) {
		return
	}

	const removingReason: {stillPulled: boolean, releasing: Promise<void>} = pulledBox.removeReasonAndUpdatePull(reason, options)
	if (!removingReason.stillPulled) {
		pulledBoxes.splice(pulledBoxes.indexOf(pulledBox), 1)
	}
	await removingReason.releasing
}