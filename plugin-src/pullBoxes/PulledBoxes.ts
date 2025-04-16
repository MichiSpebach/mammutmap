import { Box } from '../../dist/core/box/Box'
import { Link } from '../../dist/core/link/Link'
import { ClientRect } from '../../dist/core/ClientRect'
import { PulledBox, PullReason } from './PulledBox'

export class PulledBoxes {
	public pulledBoxes: PulledBox[] = []

	public async pullPath(path: Box[], wishRect: ClientRect, reason: PullReason): Promise<void> {
		let pulledBox: PulledBox|undefined = this.find(path[0])
		if (!pulledBox && !path[0].isRoot()) {	// TODO while, seek root
			pulledBox = this.find(path[0].getParent())
			if (pulledBox) {
				path = [path[0].getParent(), ...path]
			}
		}
		if (!pulledBox) {
			const boxPulling: {pulledBox: PulledBox, pulling: Promise<void>} = PulledBox.newAndPull(path[0], [reason], wishRect, null)
			pulledBox = boxPulling.pulledBox
			this.pulledBoxes.push(pulledBox)
			await boxPulling.pulling
		}
		if (path.length > 1) {
			await pulledBox.pullPath(path.slice(1), wishRect, reason)
		}
	}

	public async releaseAll(): Promise<void> {
		const pros: Promise<void>[] = []
		for (let i = this.pulledBoxes.length-1; i >= 0; i--) { // i-- because release(..) removes elements
			pros.push(this.release(this.pulledBoxes[i].box, 'all', {transitionDurationInMS: 1000}))
		}
		await Promise.all(pros)
	}
	
	public async releaseForReason(reason: Link|Box): Promise<void> {
		const pros: Promise<void>[] = []
		for (let i = this.pulledBoxes.length-1; i >= 0; i--) { // i-- because release(..) removes elements
			if (this.pulledBoxes[i].reasons.find(pullReason => pullReason.reason === reason)) {
				pros.push(this.release(this.pulledBoxes[i].box, reason, {transitionDurationInMS: 200}))
			}
		}
		await Promise.all(pros)
	}
	
	private async release(box: Box, reason: Link|Box|'all', options: {transitionDurationInMS: number}): Promise<void> {
		const pulledBox: PulledBox|undefined = this.pulledBoxes.find(pulledBox => pulledBox.box === box)
		if (!pulledBox) {
			return
		}
		const removingReason: {stillPulled: boolean, releasing: Promise<void>} = pulledBox.removeReasonAndUpdatePull(reason, options)
		if (!removingReason.stillPulled) {
			this.pulledBoxes.splice(this.pulledBoxes.indexOf(pulledBox), 1)
		}
		await removingReason.releasing
	}

	public find(box: Box): PulledBox|undefined {
		for (const pulledBox of this.pulledBoxes) {
			if (pulledBox.box === box) {
				return pulledBox
			}
			const descendant: PulledBox|undefined = pulledBox.findDescendant(box)
			if (descendant) {
				return descendant
			}
		}
		return undefined
	}

	public add(box: PulledBox): void {
		for (const pulledBox of this.pulledBoxes) {
			if (pulledBox.addDescendantIfPossible(box).added) {
				return
			}
		}
		this.pulledBoxes.push(box)
	}
}