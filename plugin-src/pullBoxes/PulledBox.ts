import { Box } from '../../dist/core/box/Box'
import { SkipToNewestScheduler } from '../../dist/core/util/SkipToNewestScheduler'
import { Link } from '../../dist/core/link/Link'
import { ClientRect } from '../../dist/core/ClientRect'
import { renderManager, RenderPriority } from '../../dist/core/renderEngine/renderManager'
import { LocalRect } from '../../dist/core/LocalRect'
import { getIntersectionRect, getUncoveredMapClientRect, PullReason } from './PullReason'
import { Item, Sorting } from '../boxOrderer/Sorting'
import { ClientPosition } from '../../dist/core/shape/ClientPosition'

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

	public async pullAncestors(biggestAncestorToConnect: PulledBox): Promise<void> {
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
			await pulledChild.detachToFitClientRect(wishRect, true)
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
		const {boxEnclosesChilds, childsWithRects, enclosingRectWithMargin} = await PulledBox.calculateIfBoxEnclosesChilds(this.box, this.pulledChildren)
		if (boxEnclosesChilds) {
			return
		}
		let rect: ClientRect = ClientRect.createEnclosing([enclosingRectWithMargin, await this.box.getClientRect()])
		const mapRect: ClientRect = await getUncoveredMapClientRect()
		if (rect.isOverlappingWith(mapRect)) {
			rect = ClientRect.fromPositions(
				new ClientPosition(Math.max(rect.x, mapRect.x), Math.max(rect.y, mapRect.y)),
				new ClientPosition(Math.min(rect.getRightX(), mapRect.getRightX()), Math.min(rect.getBottomY(), mapRect.getBottomY()))
			)
		}
		await this.detachToFitClientRect(rect, false)
		await Promise.all(childsWithRects.map(childWithRect => childWithRect.child.detachToFitClientRect(childWithRect.rect, false)))
		await this.order()
		if (this.parent) {
			await this.parent.updateSizeToEncloseChilds()
		}
	})}

	public static async calculateIfBoxEnclosesChilds(box: Box, childs: PulledBox[]): Promise<{
		boxEnclosesChilds: boolean
		childsWithRects: {child: PulledBox, rect: ClientRect}[]
		enclosingRectWithMargin: ClientRect
	}> {
		const margin: number = 8
		const marginForHeader: number = 32
		const rect: ClientRect = await box.getClientRect()
		const rectWithoutMargin: ClientRect = new ClientRect(rect.x+margin, rect.y+marginForHeader, rect.width-margin*2, rect.height-margin-marginForHeader)
		const childsWithRects: {child: PulledBox, rect: ClientRect}[] = await Promise.all(childs.map(async child => ({child, rect: await child.box.getClientRect()})))
		const enclosingRect: ClientRect = ClientRect.createEnclosing(childsWithRects.map(childWithRect => childWithRect.rect))
		return {
			boxEnclosesChilds: enclosingRect.isInsideOrEqual(rectWithoutMargin),
			childsWithRects,
			enclosingRectWithMargin: new ClientRect(enclosingRect.x-margin, enclosingRect.y-marginForHeader, enclosingRect.width+margin*2, enclosingRect.height+margin+marginForHeader)
		}
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

	public async pull(wishRect: ClientRect): Promise<void> {
		if (this.pulledChildren.length > 0) {
			await this.updateSizeToEncloseChilds()
			return
		}
		await this.detachToFitClientRect(wishRect, this.pulledChildren.length < 1)
		await this.order()
		if (this.parent) {
			await this.parent.updateSizeToEncloseChilds()
		}
	}

	public async detachToFitClientRect(rect: ClientRect, preserveAspectRatio: boolean): Promise<void> {
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

	private async order(): Promise<void> {
		return // TODO
		if (this.pulledChildren.length === 0) {
			return
		}
		const childsWithRects: {child: PulledBox, rect: ClientRect}[] = await Promise.all(this.pulledChildren.map(async child => ({child, rect: await child.box.getClientRect()})))
		let smallestMidPosX: number = Math.min(...childsWithRects.map(child => child.rect.getMidPosition().x))
		let smallestMidPosY: number = Math.min(...childsWithRects.map(child => child.rect.getMidPosition().y))
		let biggestMidPosX: number = Math.max(...childsWithRects.map(child => child.rect.getMidPosition().x))
		let biggestMidPosY: number = Math.max(...childsWithRects.map(child => child.rect.getMidPosition().y))
		
		const spread: 'horizontal'|'vertical' = biggestMidPosX-smallestMidPosX > biggestMidPosY-smallestMidPosY ? 'horizontal' : 'vertical'

		const items: Item[] = childsWithRects.map(childWithRect => ({
			node: childWithRect.child.box,
			position: spread === 'horizontal' ? childWithRect.rect.x : childWithRect.rect.y,
			size: spread === 'horizontal' ? childWithRect.rect.width : childWithRect.rect.height
		}))
		const mapRect: ClientRect = await getIntersectionRect()
		const sorting = new Sorting(
			spread === 'horizontal' ? mapRect.x : mapRect.y,
			spread === 'horizontal' ? mapRect.getRightX() : mapRect.getBottomY(),
			items
		)
		sorting.sort()

		await Promise.all(sorting.items.map(async item => {
			if (!(item.node instanceof Box)) {
				console.warn(`PulledBox::order !(item.node instanceof Box)`)
				return
			}
			const box: Box = item.node
			const boxRect: ClientRect = await box.getClientRect()
			const rect: ClientRect = spread === 'horizontal'
				? new ClientRect(item.position, boxRect.y, item.size, boxRect.height)
				: new ClientRect(boxRect.x, item.position, boxRect.x, item.size)
			await box.site.detachToFitClientRect(rect, {preserveAspectRatio: false/*TODO call PulledBox::pull instead*/, transitionDurationInMS: 200, renderStylePriority: RenderPriority.RESPONSIVE})
		}))
	}
}