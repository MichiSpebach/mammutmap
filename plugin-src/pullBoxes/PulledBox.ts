import { Box } from '../../dist/core/box/Box'
import { SkipToNewestScheduler } from '../../dist/core/util/SkipToNewestScheduler'
import { Link } from '../../dist/core/link/Link'
import { ClientRect } from '../../dist/core/ClientRect'
import { renderManager, RenderPriority } from '../../dist/core/renderEngine/renderManager'
import { LocalRect } from '../../dist/core/LocalRect'
import * as pullUtil from './pullUtil'
import { PullReason } from './PullReason'
import { Item, Sorting } from '../boxOrderer/Sorting'
import { ClientPosition } from '../../dist/core/shape/ClientPosition'

export class PulledBox {
	public readonly box: Box
	private readonly pullScheduler = new SkipToNewestScheduler()
	public reasons: PullReason[]
	public parent: PulledBox|null
	public pulledChildren: PulledBox[] = []
	private lastPullDirection: {x: number, y: number}|undefined = undefined

	public constructor(box: Box, reasons: PullReason[], parent: PulledBox|null) {
		this.box = box
		this.reasons = reasons
		this.parent = parent
	}

	public async pull(reason: PullReason): Promise<void> { await this.pullScheduler.schedule(async () => {
		if (this.pulledChildren.length > 0) {
			await this.updateSizeToEncloseChilds()
			await this.order()
			await this.updateSizeToEncloseChilds()
			return
		}
		const pullPosition: {position: ClientPosition, direction: {x: number, y: number}} = await reason.calculatePullPositionFor(this.box)
		this.lastPullDirection = pullPosition.direction
		let pullRect: ClientRect = reason.createPullRect(pullPosition.position)
		const boxRect: ClientRect = await this.box.getClientRect()
		const mapRect: ClientRect = await pullUtil.getUncoveredMapClientRect()
		const boxRectClippedInsideScreen: ClientRect|undefined = ClientRect.createIntersection([boxRect, mapRect])
		if (boxRectClippedInsideScreen) {
			pullRect = ClientRect.createEnclosing([boxRectClippedInsideScreen, pullRect])
		}
		await this.detachToFitClientRect(pullRect, this.pulledChildren.length < 1)
	})}

	public async detachToFitClientRect(rect: ClientRect, preserveAspectRatio: boolean): Promise<void> {
		if (preserveAspectRatio) {
			rect = pullUtil.shrinkRectToAspectRatio(rect, this.calculateSavedAspectRatio())
		}
		await Promise.all([
			this.box.site.detachToFitClientRect(rect, {preserveAspectRatio: false, transitionDurationInMS: 200, renderStylePriority: RenderPriority.RESPONSIVE}),
			renderManager.addStyleTo(this.box.getBorderId(), {
				boxShadow: 'blueviolet 0 0 10px, blueviolet 0 0 10px',
				transition: 'box-shadow 1s'
			})
		])
	}

	private async updateSizeToEncloseChilds(): Promise<void> { await pullUtil.detachScheduler.schedule('concurrent', async () => {
		if (this.pulledChildren.length === 0) {
			console.warn(`PulledBox::updateSizeToEncloseChilds() called but this.pulledChildren.length === 0`)
			return
		}
		const {boxEnclosesChilds, childsWithRects, enclosingRectWithMargin} = await PulledBox.calculateIfBoxEnclosesChilds(this.box, this.pulledChildren)
		if (boxEnclosesChilds) {
			return
		}
		const rect: ClientRect = await this.box.getClientRect()
		const mapRect: ClientRect = await pullUtil.getUncoveredMapClientRect()
		let updatedRect: ClientRect
		if (rect.isInsideOrEqual(mapRect)) {
			updatedRect = ClientRect.createEnclosing([rect, enclosingRectWithMargin])
		} else {
			updatedRect = PulledBox.calculateLeastTransformedRectToSurround(rect, enclosingRectWithMargin)
			updatedRect = ClientRect.fromPositions(
				new ClientPosition(Math.max(updatedRect.x, mapRect.x), Math.max(updatedRect.y, mapRect.y)),
				new ClientPosition(Math.min(updatedRect.getRightX(), mapRect.getRightX()), Math.min(updatedRect.getBottomY(), mapRect.getBottomY()))
			)
		}
		await this.detachToFitClientRect(updatedRect, false)
		await Promise.all(childsWithRects.map(childWithRect => childWithRect.child.detachToFitClientRect(childWithRect.rect, false)))
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

	/** public for test */
	public static calculateLeastTransformedRectToSurround(rect: ClientRect, toSurround: ClientRect): ClientRect {
		let x: number
		let y: number
		const width: number = Math.max(rect.width, toSurround.width)
		const height: number = Math.max(rect.height, toSurround.height)
		if (rect.x < toSurround.x) {
			if (rect.getRightX() < toSurround.getRightX()) {
				x = toSurround.getRightX() - width
			} else {
				x = rect.x
			}
		} else {
			x = toSurround.x
		}
		if (rect.y < toSurround.y) {
			if (rect.getBottomY() < toSurround.getBottomY()) {
				y = toSurround.getBottomY() - height
			} else {
				y = rect.y
			}
		} else {
			y = toSurround.y
		}
		return new ClientRect(x, y, width, height)
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

	public findChild(box: Box): PulledBox|undefined {
		return this.pulledChildren.find(child => child.box === box)
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

	public async getSide(): Promise<'left'|'top'|'right'|'bottom'|undefined> {
		const sides: ('left'|'top'|'right'|'bottom')[] = ['left', 'top', 'right', 'bottom']
		const sideRects = sides.map(side => ({side, rect: pullUtil.getSideRect(side)}))
		const boxPosition: ClientPosition = (await this.box.getClientRect()).getMidPosition()
		for (const sideRect of sideRects) {
			if ((await sideRect.rect).isPositionInside(boxPosition)) {
				return sideRect.side
			}
		}
		return undefined
	}

	private async order(): Promise<void> {
		if (this.pulledChildren.length < 2) {
			return
		}

		const direction: 'horizontal'|'vertical' = await this.calculateOrderDirection()
		const items: Item[] = await Promise.all(this.pulledChildren.map(async pulledChild => {
			const pulledChildRect: ClientRect = await pulledChild.box.getClientRect()
			return {
				node: pulledChild.box,
				position: direction === 'horizontal' ? pulledChildRect.x : pulledChildRect.y,
				size: direction === 'horizontal' ? pulledChildRect.width : pulledChildRect.height
			}
		}))
		const uncoveredMapRect: ClientRect = await pullUtil.getUncoveredMapClientRect()
		const sorting = new Sorting(
			direction === 'horizontal' ? uncoveredMapRect.x : uncoveredMapRect.y,
			direction === 'horizontal' ? uncoveredMapRect.getRightX() : uncoveredMapRect.getBottomY(),
			items,
			8
		)
		sorting.sort()

		await Promise.all(sorting.items.map(async item => {
			if (!(item.node instanceof Box)) {
				console.warn(`PulledBox::order !(item.node instanceof Box)`)
				return
			}
			const child: PulledBox|undefined = this.findChild(item.node)
			if (!child) {
				console.warn(`PulledBox::order !child`)
				return
			}
			const boxRect: ClientRect = await child.box.getClientRect()
			const rect: ClientRect = direction === 'horizontal'
				? new ClientRect(item.position, boxRect.y, item.size, boxRect.height)
				: new ClientRect(boxRect.x, item.position, boxRect.width, item.size)
			await child.detachToFitClientRect(rect, false)
		}))
	}

	private async calculateOrderDirection(): Promise<'horizontal'|'vertical'> {
		const boxRect: ClientRect = await this.box.getClientRect()
		let horizontalCount: number = 0
		let verticalCount: number = 0
		
		await Promise.all(this.pulledChildren.map(async pulledChild => {
			await Promise.all(pulledChild.reasons.map(async reason => {
				const pullDirection: {x: number, y: number} = await pulledChild.calculatePullDirectionForRectAndReason(boxRect, reason)
				Math.abs(pullDirection.x) > Math.abs(pullDirection.y) ? verticalCount++ : horizontalCount++
			}))
		}))

		if (horizontalCount < verticalCount) {
			return 'vertical'
		} else {
			return 'horizontal'
		}
	}

	private async calculatePullDirectionForRectAndReason(rect: ClientRect, reason: PullReason): Promise<{x: number, y: number}> {
		const intersection: {position: ClientPosition, direction: {x: number, y: number}} | undefined = await reason.calculateIntersectionOfRouteWithRect(rect, {warnIfMultipleIntersectionsWithOneLink: true})
		if (intersection) {
			return intersection.direction
		}
		// !intersection happens if reasonBox overlaps rect before reasonBox is moved aside
		if (this.lastPullDirection) {
			return this.lastPullDirection
		}
		console.warn(`PulledBox::calculatePullDirectionForRectAndReason() !intersection and !this.pullDirection box.id=${this.box.getId()} rect=${JSON.stringify(rect)}`)
		return {x: 0, y: 0}
	}
}