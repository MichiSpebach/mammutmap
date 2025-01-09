import { Box } from '../../dist/core/box/Box'
import { BoxWatcher } from '../../dist/core/box/BoxWatcher'
import { Link } from '../../dist/core/link/Link'
import { ClientRect } from '../../dist/core/ClientRect'
import { RenderPriority } from '../../dist/core/RenderManager'

const pulledBoxes: {box: Box, reasons: {link: Link, watcher: BoxWatcher}[]}[] = []

export async function pull(box: Box, wishRect: ClientRect, reason: {link: Link, watcher: BoxWatcher}): Promise<void> {
	const pulledBox = pulledBoxes.find(pulledBox => pulledBox.box === box)
	if (pulledBox) {
		pulledBox.reasons.push(reason)
	} else {
		pulledBoxes.push({box, reasons: [reason]})
	}
	await box.site.detachToFitClientRect(wishRect, {transitionDurationInMS: 200, renderStylePriority: RenderPriority.RESPONSIVE})
}

export async function releaseForLink(link: Link): Promise<void> {
	const pros: Promise<void>[] = []
	for (let i = pulledBoxes.length-1; i >= 0; i--) {
		if (pulledBoxes[i].reasons.find(reason => reason.link === link)) {
			pros.push(release(pulledBoxes[i].box, link))
		}
	}
	await Promise.all(pros)
}

export async function release(box: Box, link: Link): Promise<void> {
	const pulledBoxIndex = pulledBoxes.findIndex(pulledBox => pulledBox.box === box)
	const pulledBox = pulledBoxes[pulledBoxIndex]
	if (!pulledBox) {
		return
	}

	const reasons: {link: Link, watcher: BoxWatcher}[] = []
	for (let i = pulledBox.reasons.length-1; i >= 0; i--) {
		if (pulledBox.reasons[i].link === link) {
			reasons.push(...pulledBox.reasons.splice(i, 1))
		}
	}
	
	if (pulledBox.reasons.length < 1) {
		pulledBoxes.splice(pulledBoxIndex, 1)
		await box.site.releaseIfDetached({transitionDurationInMS: 200, renderStylePriority: RenderPriority.RESPONSIVE}) // await because in some cases important that box is still watched
	}
	await Promise.all(reasons.map(reason => reason.watcher.unwatch()))
}