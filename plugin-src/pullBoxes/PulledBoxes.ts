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
			//pulledBox = new PulledBox(box, [reason], this.find(box.getParent())?? null) // TODO: activate
			pulledBox = new PulledBox(box, [reason], null) // TODO: remove
			await this.pullAncestorsOf(pulledBox) // TODO: remove
			await this.updateDescendantsOf(pulledBox)
			if (!pulledBox.parent) {
				this.pulledBoxes.push(pulledBox)
			}
		}
		
		const pullPosition: ClientPosition = await reason.calculatePullPositionFor(box) // move into PulledBox::pull?
		const pullRect: ClientRect = reason.createPullRect(pullPosition) // move into PulledBox::pull?
		await pulledBox.pull(pullRect)
		if (!pulledBox.parent && !pulledBox.box.getParent().isRoot()) {
			await this.pullBoxIfNecessary(pulledBox.box.getParent(), reason)
		}
		return {pulled: true}
	}

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
			await pulledBox.detachToFitClientRect(wishRect, true)
		}
	}

	private async addPulledBoxAndUpdateDescendants(pulledBox: PulledBox): Promise<void> {
		const updatingDescendants: Promise<void> = this.updateDescendantsOf(pulledBox)
		this.pulledBoxes.push(pulledBox)
		await updatingDescendants
	}

	private async pullAncestorsOf(pulledBox: PulledBox): Promise<void> {
		for (const otherPulledBox of this.pulledBoxes) {
			if (otherPulledBox.box.isAncestorOf(pulledBox.box)) {
				await pulledBox.pullAncestors(otherPulledBox)
				break
			}
		}
	}
	
	private async updateDescendantsOf(pulledBox: PulledBox): Promise<void> {
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

	private getPulledChildrenOf(box: Box): PulledBox[] {
		return this.pulledBoxes.filter(child => child.box.getParent() === box)
	}
}