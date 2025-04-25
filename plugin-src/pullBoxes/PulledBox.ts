import { Box } from '../../dist/core/box/Box'
import { SkipToNewestScheduler } from '../../dist/core/util/SkipToNewestScheduler'
import { Link } from '../../dist/core/link/Link'
import { LinkRoute } from '../../dist/core/link/LinkRoute'
import { ClientRect } from '../../dist/core/ClientRect'
import { renderManager, RenderPriority } from '../../dist/core/renderEngine/renderManager'
import { LocalRect } from '../../dist/core/LocalRect'

export type PullReason = {reason: Link|Box, route: LinkRoute}

export class PulledBox {
	public readonly box: Box
	private readonly updateSizeScheduler = new SkipToNewestScheduler()
	public reasons: PullReason[]
	public parent: PulledBox|null
	public pulledChildren: PulledBox[] = []

	public constructor(box: Box, reasons: PullReason[], parent: PulledBox|null) {
		this.box = box
		this.reasons = reasons
		this.parent = parent
	}

	public async pullAncestors(biggestAncestorToConnect: PulledBox) {
		if (this.parent) {
			console.warn(`PulledBox::pullAncestors this.parent`)
		}
		let biggestAncestorSoFar: PulledBox = this
		while (biggestAncestorSoFar.box !== biggestAncestorToConnect.box) {
			if (biggestAncestorSoFar.box.isRoot()) {
				console.warn(`PulledBox::pullAncestors biggestAncestorSoFar.box.isRoot()`)
				return
			}
			const parent: PulledBox = biggestAncestorSoFar.box.getParent() !== biggestAncestorToConnect.box
				? new PulledBox(biggestAncestorSoFar.box.getParent(), this.reasons, null)
				: biggestAncestorToConnect
			parent.pulledChildren.push(biggestAncestorSoFar)
			biggestAncestorSoFar.parent = parent
			biggestAncestorSoFar = parent
		}
		if (!this.parent) {
			console.warn(`PulledBox::pullAncestors !this.parent this only happens if biggestAncestorToConnect === this.box`)
			return
		}
		await this.parent.updateSizeToEncloseChilds()
	}

	public async pullPath(path: Box[], wishRect: ClientRect, reason: PullReason): Promise<void> {
		if (!this.box.getChilds().includes(path[0])) {
			console.warn('PulledBox::pullPath(..) !this.box.getChilds().includes(path[0])')
		}
		let pulledChild: PulledBox|undefined = this.pulledChildren.find(pulledBox => pulledBox.box === path[0])
		if (pulledChild) {
			if (!pulledChild.reasons.includes(reason)) {
				pulledChild.reasons.push(reason)
			}
		} else {
			pulledChild = new PulledBox(path[0], [reason], this)
			this.pulledChildren.push(pulledChild)
			await pulledChild.pull(wishRect, true)
		}
		if (path.length > 1) {
			await pulledChild.pullPath(path.slice(1), wishRect, reason)
		} else {
			await this.updateSizeToEncloseChilds()
		}
	}

	private async updateSizeToEncloseChilds(): Promise<void> { await this.updateSizeScheduler.schedule(async () => {
		if (this.pulledChildren.length === 0) {
			console.warn(`PulledBox::updateSizeToEncloseChilds() called but this.pulledChildren.length === 0`)
			return
		}
		const margin: number = 8
		const marginForHeader: number = 32
		const rect: ClientRect = await this.box.getClientRect()
		const rectWithoutMargin: ClientRect = new ClientRect(rect.x+margin, rect.y+marginForHeader, rect.width-margin*2, rect.height-margin-marginForHeader)
		const childsWithRects: {child: PulledBox, rect: ClientRect}[] = await Promise.all(this.pulledChildren.map(async child => ({child, rect: await child.box.getClientRect()})))
		const enclosingRect: ClientRect = ClientRect.createEnclosing(childsWithRects.map(childWithRect => childWithRect.rect))
		if (enclosingRect.isInsideOrEqual(rectWithoutMargin)) {
			return
		}
		await this.pull(new ClientRect(enclosingRect.x-margin, enclosingRect.y-marginForHeader, enclosingRect.width+margin*2, enclosingRect.height+margin+marginForHeader), false)
		await Promise.all(childsWithRects.map(childWithRect => childWithRect.child.pull(childWithRect.rect, false)))
		if (this.parent) {
			await this.parent.updateSizeToEncloseChilds()
		}
	})}

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

	public async pull(rect: ClientRect, preserveAspectRatio: boolean): Promise<void> {
		if (preserveAspectRatio) {
			rect = this.fitRectPreservingAspectRatio(rect, this.calculateSavedAspectRatio())
		}
		await Promise.all([
			this.box.site.detachToFitClientRect(rect, {preserveAspectRatio: false, transitionDurationInMS: 200, renderStylePriority: RenderPriority.RESPONSIVE}),
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

	public fitRectPreservingAspectRatio(rect: ClientRect, aspectRatio: number): ClientRect {
		if (rect.width/rect.height > aspectRatio) {
			const fittedWidth: number = rect.height*aspectRatio
			return new ClientRect(rect.x + (rect.width-fittedWidth)/2, rect.y, fittedWidth, rect.height)
		} else {
			const fittedHeight: number = rect.width/aspectRatio
			return new ClientRect(rect.x, rect.y + (rect.height-fittedHeight)/2, rect.width, fittedHeight)
		}
	}

	public calculateSavedAspectRatio(): number {
		let savedAspectRatio: number = 1
		for (let currentBox = this.box; ; currentBox = currentBox.getParent()) {
			const savedRect: LocalRect = currentBox.getLocalRectToSave()
			savedAspectRatio *= savedRect.width/savedRect.height
			if (currentBox.isRoot()) {
				break
			}
		}
		return savedAspectRatio
	}
}