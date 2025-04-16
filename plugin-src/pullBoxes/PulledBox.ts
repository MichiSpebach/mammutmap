import { Box } from '../../dist/core/box/Box'
import { SkipToNewestScheduler } from '../../dist/core/util/SkipToNewestScheduler'
import { Link } from '../../dist/core/link/Link'
import { LinkRoute } from '../../dist/core/link/LinkRoute'
import { ClientRect } from '../../dist/core/ClientRect'
import { renderManager, RenderPriority } from '../../dist/core/renderEngine/renderManager'

export type PullReason = {reason: Link|Box, route: LinkRoute}

export class PulledBox {
	public readonly box: Box
	private readonly updateSizeScheduler = new SkipToNewestScheduler()
	public reasons: PullReason[]
	public parent: PulledBox|null
	public pulledChildren: PulledBox[] = []

	public static newAndPull(box: Box, reasons: PullReason[], rect: ClientRect, parent: PulledBox|null): {pulledBox: PulledBox, pulling: Promise<void>} {
		const pulledBox = new PulledBox(box, reasons, parent)
		return {pulledBox, pulling: pulledBox.pull(rect)}
	}

	private constructor(box: Box, reasons: PullReason[], parent: PulledBox|null) {
		this.box = box
		this.reasons = reasons
		this.parent = parent
	}

	public async pullPath(path: Box[], wishRect: ClientRect, reason: PullReason): Promise<void> {
		if (!this.box.getChilds().includes(path[0])) {
			console.warn('PulledBox::pullPath(..) !this.box.getChilds().includes(path[0])')
		}
		let pulledChild: PulledBox|undefined = this.pulledChildren.find(pulledBox => pulledBox.box === path[0])
		if (!pulledChild) {
			const boxPulling: {pulledBox: PulledBox, pulling: Promise<void>} = PulledBox.newAndPull(path[0], [reason], wishRect, this)
			pulledChild = boxPulling.pulledBox
			this.pulledChildren.push(pulledChild)
			await boxPulling.pulling
		}
		if (path.length > 1) {
			await pulledChild.pullPath(path.slice(1), wishRect, reason)
		} else {
			await this.updateSizeToEncloseChilds()
		}
	}

	private async updateSizeToEncloseChilds(): Promise<void> { await this.updateSizeScheduler.schedule(async () => {
		const margin: number = 8
		const marginForHeader: number = 32
		const rect: ClientRect = await this.box.getClientRect()
		const rectWithoutMargin: ClientRect = new ClientRect(rect.x+margin, rect.y+marginForHeader, rect.width-margin*2, rect.height-margin-marginForHeader)
		const childsWithRects: {child: PulledBox, rect: ClientRect}[] = await Promise.all(this.pulledChildren.map(async child => ({child, rect: await child.box.getClientRect()})))
		const enclosingRect: ClientRect = ClientRect.createEnclosing(childsWithRects.map(childWithRect => childWithRect.rect))
		if (enclosingRect.isInsideOrEqual(rectWithoutMargin)) {
			return
		}
		await this.box.site.detachToFitClientRect(new ClientRect(enclosingRect.x-margin, enclosingRect.y-marginForHeader, enclosingRect.width+margin*2, enclosingRect.height+margin+marginForHeader), {preserveAspectRatio: false, transitionDurationInMS: 200}),
		await Promise.all(childsWithRects.map(childWithRect => childWithRect.child.box.site.detachToFitClientRect(childWithRect.rect, {preserveAspectRatio: false, transitionDurationInMS: 200})))
		if (this.parent) {
			await this.parent.updateSizeToEncloseChilds()
		}
	})}

	public async addReasonAndUpdatePull(reason: PullReason, rect: ClientRect): Promise<void> {
		if (this.reasons.includes(reason)) {
			console.warn('PulledBox::addReasonAndUpdatePull(..) already includes reason')
		} else {
			this.reasons.push(reason)
		}
		await this.pull(rect)
	}

	public removeReasonAndUpdatePull(reason: Link|Box|'all', options: {transitionDurationInMS: number, notUnwatchReasonRoute?: boolean}): {stillPulled: boolean, releasing: Promise<void>} {
		let childrenStillPulled: boolean = false
		const releasingChildren: Promise<void>[] = []
		for (let i = this.pulledChildren.length-1; i >= 0; i--) {
			const child = this.pulledChildren[i]
			const {stillPulled, releasing} = child.removeReasonAndUpdatePull(reason, {...options, notUnwatchReasonRoute: true})
			if (stillPulled) {
				childrenStillPulled = true
			} else {
				this.pulledChildren.splice(this.pulledChildren.indexOf(child), 1)
			}
			releasingChildren.push(releasing)
		}
		
		const removedReasons: PullReason[] = []
		for (let i = this.reasons.length-1; i >= 0; i--) {
			if (reason === 'all' || this.reasons[i].reason === reason) {
				removedReasons.push(...this.reasons.splice(i, 1))
			}
		}
		const stillPulled: boolean = this.reasons.length > 0
		return {stillPulled, releasing: (async () => {
			if (!stillPulled) {
				if (childrenStillPulled) {
					console.warn('PulledBox::removeReasonAndUpdatePull(..) !stillPulled but childrenStillPulled')
				}
				await this.release(options.transitionDurationInMS)
			}
			await Promise.all(releasingChildren)
			if (!options.notUnwatchReasonRoute) {
				await Promise.all(removedReasons.map(reason => reason.route.unwatch()))
			}
		})()}
	}

	private async pull(rect: ClientRect): Promise<void> {
		await Promise.all([
			this.box.site.detachToFitClientRect(rect, {preserveAspectRatio: true, transitionDurationInMS: 200, renderStylePriority: RenderPriority.RESPONSIVE}),
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

	public findDescendant(box: Box): PulledBox|undefined {
		if (!this.box.isAncestorOf(box)) {
			return undefined
		}
		for (const child of this.pulledChildren) {
			if (child.box === box) {
				return child
			}
			const descendant: PulledBox|undefined = child.findDescendant(box)
			if (descendant) {
				return descendant
			}
		}
		return undefined
	}

	public addDescendantIfPossible(descendant: PulledBox): {added: boolean} {
		if (!this.box.isAncestorOf(descendant.box)) {
			return {added: false}
		}
		if (descendant.box.getParent() === this.box) {
			this.pulledChildren.push(descendant)
			return {added: true}
		}
		for (const child of this.pulledChildren) {
			if (child.addDescendantIfPossible(descendant)) {
				return {added: true}
			}
		}
		console.warn(`PulledBox::addDescendantIfPossible(..) failed`)
		return {added: false}
	}
}