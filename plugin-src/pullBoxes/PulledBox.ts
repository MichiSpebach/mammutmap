import { Box } from '../../dist/core/box/Box'
import { Link } from '../../dist/core/link/Link'
import { LinkRoute } from '../../dist/core/link/LinkRoute'
import { ClientRect } from '../../dist/core/ClientRect'
import { renderManager, RenderPriority } from '../../dist/core/renderEngine/renderManager'

export type PullReason = {reason: Link|Box, route: LinkRoute}

export class PulledBox {
	public readonly box: Box
	public reasons: PullReason[]
	public pulledChildren: Box[] = []

	public static newAndPull(box: Box, reasons: PullReason[], rect: ClientRect): {pulledBox: PulledBox, pulling: Promise<void>} {
		const pulledBox = new PulledBox(box, reasons)
		return {pulledBox, pulling: pulledBox.pull(rect)}
	}

	private constructor(box: Box, reasons: PullReason[]) {
		this.box = box
		this.reasons = reasons
	}

	public async addReasonAndUpdatePull(reason: PullReason, rect: ClientRect): Promise<void> {
		this.reasons.push(reason)
		await this.pull(rect)
	}

	public removeReasonAndUpdatePull(reason: Link|Box|'all', options: {transitionDurationInMS: number}): {stillPulled: boolean, releasing: Promise<void>} {
		const removedReasons: PullReason[] = []
		for (let i = this.reasons.length-1; i >= 0; i--) {
			if (reason === 'all' || this.reasons[i].reason === reason) {
				removedReasons.push(...this.reasons.splice(i, 1))
			}
		}
		const stillPulled: boolean = this.reasons.length > 0
		return {stillPulled, releasing: (async () => {
			if (!stillPulled) {
				await this.release(options.transitionDurationInMS) // await because in some cases important that box is still watched
			}
			await Promise.all(removedReasons.map(reason => reason.route.unwatch()))
		})()}
	}

	private async pull(rect: ClientRect): Promise<void> {
		await Promise.all([
			this.box.site.detachToFitClientRect(rect, {transitionDurationInMS: 200, renderStylePriority: RenderPriority.RESPONSIVE}),
			renderManager.addStyleTo(this.box.getBorderId(), {
				boxShadow: 'blueviolet 0 0 10px, blueviolet 0 0 10px',
				transition: 'box-shadow 1s'
			})
		])
	}

	private async release(transitionDurationInMS: number): Promise<void> {
		await this.box.site.releaseIfDetached({
			transitionDurationInMS,
			renderStylePriority: RenderPriority.RESPONSIVE
		})
		await renderManager.addStyleTo(this.box.getBorderId(), {
			boxShadow: null
		})
	}
}