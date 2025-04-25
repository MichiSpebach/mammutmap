import { Box } from '../../dist/core/box/Box'
import { Link } from '../../dist/core/link/Link'
import { ClientRect } from '../../dist/core/ClientRect'
import { PulledBox, PullReason } from './PulledBox'

export class PulledBoxes {
	public pulledBoxes: PulledBox[] = []

	public async pullPath(path: Box[], wishRect: ClientRect, reason: PullReason): Promise<void> {
		let pulledBox: PulledBox|undefined = this.find(path[0])
		if (!pulledBox) {
			let foundPath: Box[] = path
			while (!foundPath[0].isRoot()) {
				pulledBox = this.find(foundPath[0].getParent())
				foundPath = [foundPath[0].getParent(), ...foundPath]
				if (pulledBox) {
					path = foundPath
					break
				}
			}
		}
		if (pulledBox) {
			if (!pulledBox.reasons.includes(reason)) {
				pulledBox.reasons.push(reason)
			}
		} else {
			pulledBox = new PulledBox(path[0], [reason], null)
			await this.addPulledBoxAndUpdateDescendants(pulledBox)
		}
		if (path.length > 1) {
			await pulledBox.pullPath(path.slice(1), wishRect, reason)
		} else {
			await pulledBox.pull(wishRect, true)
		}
	}

	private async addPulledBoxAndUpdateDescendants(pulledBox: PulledBox): Promise<void> {
		const pros: Promise<void>[] = []
		for (let i = this.pulledBoxes.length-1; i >= 0; i--) { // i-- because removes elements
			const otherPulledBox: PulledBox = this.pulledBoxes[i]
			if (pulledBox.box.isAncestorOf(otherPulledBox.box)) {
				pros.push(otherPulledBox.pullAncestors(pulledBox))
				this.pulledBoxes.splice(i, 1)
				for (const reason of otherPulledBox.reasons) {
					if (!pulledBox.reasons.includes(reason)) {
						pulledBox.reasons.push(reason)
					}
				}
			}
		}
		this.pulledBoxes.push(pulledBox)
		await Promise.all(pros)
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
}