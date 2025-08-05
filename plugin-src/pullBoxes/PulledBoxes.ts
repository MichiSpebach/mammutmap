import { Box } from '../../dist/core/box/Box'
import { Link } from '../../dist/core/link/Link'
import { ClientRect } from '../../dist/core/ClientRect'
import { PulledBox } from './PulledBox'
import { PullReason } from './PullReason'
import { ClientPosition } from '../../dist/core/shape/ClientPosition'

export class PulledBoxes {
	public pulledBoxes: PulledBox[] = []

	public async pullBoxIfNecessary(box: Box, reason: PullReason): Promise<{pulled: boolean}> {
		if (box.isRoot()) {
			console.warn(`PulledBoxes::pullBoxIfNecessary(box: ${box.getName()}) cannot pull root`)
			return {pulled: false}
		}

		const pros: Promise<void>[] = []
		let pulledBox: PulledBox|undefined = this.find(box)
		if (pulledBox) {
			if (!pulledBox.reasons.includes(reason)) {
				pulledBox.reasons.push(reason)
			}
		} else {
			const pullingUnnecessaryRegardingSizeAndPosition: Promise<boolean> = reason.shouldNotPullBox(box)
			const pulledChildren: PulledBox[] = this.getPulledChildrenOf(box)
			const pullingUnnecessaryBecauseChildrenEnclosed = pulledChildren.length < 1 || (await PulledBox.calculateIfBoxEnclosesChilds(box, pulledChildren)).boxEnclosesChilds
			if (await pullingUnnecessaryRegardingSizeAndPosition && pullingUnnecessaryBecauseChildrenEnclosed) {
				return {pulled: false}
			}
			pulledBox = new PulledBox(box, [reason], this.find(box.getParent())?? null)
			if (pulledBox.parent) {
				pulledBox.parent.pulledChildren.push(pulledBox)
			} else {
				this.pulledBoxes.push(pulledBox)
			}
			this.addOrphanedDescendantsTo(pulledBox)
		}
		
		const pullPosition: ClientPosition = await reason.calculatePullPositionFor(box) // move into PulledBox::pull?
		const pullRect: ClientRect = reason.createPullRect(pullPosition) // move into PulledBox::pull?
		await pulledBox.pull(pullRect)
		if (!pulledBox.box.getParent().isRoot()) {
			await this.pullBoxIfNecessary(pulledBox.box.getParent(), reason)
		}
		return {pulled: true}
	}
	
	private addOrphanedDescendantsTo(pulledBox: PulledBox): void {
		for (let i = this.pulledBoxes.length-1; i >= 0; i--) { // i-- because removes elements
			const otherPulledBox: PulledBox = this.pulledBoxes[i]
			if (pulledBox.box.isAncestorOf(otherPulledBox.box)) {
				pulledBox.pulledChildren.push(otherPulledBox)
				otherPulledBox.parent = pulledBox
				this.pulledBoxes.splice(i, 1)
				for (const reason of otherPulledBox.reasons) {
					if (!pulledBox.reasons.includes(reason)) {
						pulledBox.reasons.push(reason)
					}
				}
			}
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

	private getPulledChildrenOf(box: Box): PulledBox[] {
		return this.pulledBoxes.filter(child => child.box.getParent() === box)
	}
}