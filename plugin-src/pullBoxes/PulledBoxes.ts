import { Box } from '../../dist/core/box/Box'
import { Link } from '../../dist/core/link/Link'
import { ClientRect } from '../../dist/core/ClientRect'
import { PulledBox } from './PulledBox'
import { PullReason } from './PullReason'
import { ClientPosition } from '../../dist/core/shape/ClientPosition'
import * as pullUtil from './pullUtil'
import { SkipToNewestScheduler } from '../../dist/core/util/SkipToNewestScheduler'
import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'

export class PulledBoxes {
	public pulledBoxes: PulledBox[] = []
	private readonly zoomOutToDisjoinBoxesScheduler = new SkipToNewestScheduler()

	public async pullBoxIfNecessary(box: Box, reason: PullReason): Promise<{pulled: boolean}> {
		const {pulled} = await this.pullBoxIfNecessaryWithoutOrdering(box, reason)
		await this.zoomOutToDisjoinReasonBoxes()
		return {pulled}
	}

	private async pullBoxIfNecessaryWithoutOrdering(box: Box, reason: PullReason): Promise<{pulled: boolean}> {
		if (box.isRoot()) {
			console.warn(`PulledBoxes::pullBoxIfNecessary(box: ${box.getName()}) cannot pull root`)
			return {pulled: false}
		}

		let pulledBox: PulledBox|undefined = this.find(box)
		if (pulledBox) {
			if (!pulledBox.reasons.includes(reason)) {
				pulledBox.reasons.push(reason)
			}
		} else {
			const pullingUnnecessaryRegardingSizeAndPosition: Promise<boolean> = reason.shouldNotPullBox(box)
			const pulledChildren: PulledBox[] = this.getPulledChildrenOf(box)
			const pullingUnnecessaryBecauseChildrenEnclosed = pulledChildren.length < 1 || (await PulledBox.calculateIfBoxEnclosesChilds(box, pulledChildren)).boxEnclosesChilds
			const pullingUnnecessary: boolean = await pullingUnnecessaryRegardingSizeAndPosition && pullingUnnecessaryBecauseChildrenEnclosed
			pulledBox = this.find(box) // refind, otherwise race condition because of awaits above, leads to two PulledBoxes refering the same Box
			if (pulledBox) {
				if (!pulledBox.reasons.includes(reason)) {
					pulledBox.reasons.push(reason)
				}
			} else {
				if (pullingUnnecessary) {
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
		}
		
		const pullPosition: ClientPosition = await reason.calculatePullPositionFor(box) // move into PulledBox::pull?
		const pullRect: ClientRect = reason.createPullRect(pullPosition) // move into PulledBox::pull?
		await pulledBox.pull(pullRect)
		const parentBox: Box = pulledBox.box.getParent()
		if (parentBox.isRoot() || parentBox.isAncestorOf(await reason.route.followOriginAndWatch()) && parentBox.isAncestorOf(await reason.route.followDestinationAndWatch())) {
			return {pulled: true}
		}
		await this.pullBoxIfNecessaryWithoutOrdering(parentBox, reason)
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

	private async zoomOutToDisjoinReasonBoxes(): Promise<void> { await this.zoomOutToDisjoinBoxesScheduler.schedule(async () => {
		const reasonBoxes: Box[] = []
		for (const pulledBox of this.pulledBoxes) {
			for (const reason of pulledBox.reasons) {
				if (reason.reason instanceof Box && !reasonBoxes.includes(reason.reason)) {
					reasonBoxes.push(reason.reason)
				}
			}
		}
		await Promise.all(reasonBoxes.map(reasonBox => this.zoomOutToDisjoinBox(reasonBox)))
	})}

	/** TODO: improve and cleanup or rewrite */
	private async zoomOutToDisjoinBox(box: Box): Promise<void> {
		const marginToOtherBoxesInPixels: number = 20
		const uncoveredMapRect: ClientRect = await pullUtil.getUncoveredMapClientRect()
		let boxRect: ClientRect = await box.getClientRect()
		boxRect = new ClientRect(
			boxRect.x - marginToOtherBoxesInPixels,
			boxRect.y - marginToOtherBoxesInPixels,
			boxRect.width + marginToOtherBoxesInPixels*2,
			boxRect.height + marginToOtherBoxesInPixels*2
		)
		let overlapLeft: number|undefined = undefined
		let overlapTop: number|undefined = undefined
		let overlapRight: number|undefined = undefined
		let overlapBottom: number|undefined = undefined
		let minX: number = Math.min(boxRect.x, uncoveredMapRect.x)
		let minY: number = Math.min(boxRect.y, uncoveredMapRect.y)
		let maxX: number = Math.max(boxRect.getRightX(), uncoveredMapRect.getRightX())
		let maxY: number = Math.max(boxRect.getBottomY(), uncoveredMapRect.getBottomY())
		const jinks: {x: number, y: number}[] = []
		await Promise.all(this.pulledBoxes.map(async pulledBox => {
			const pulledRect: ClientRect = await pulledBox.box.getClientRect()
			if (boxRect.isOverlappingWith(pulledRect)) {
				switch (await pulledBox.getSide()) {
					case 'left':
						jinks.push({x: pulledRect.getRightX() - boxRect.x, y: 0})
					case 'top':
						jinks.push({x: 0, y: pulledRect.getBottomY() - boxRect.y})
					case 'right':
						jinks.push({x: pulledRect.x - boxRect.getRightX(), y: 0})
					case 'bottom':
						jinks.push({x: 0, y: pulledRect.y - boxRect.getBottomY()})
				}
			}
			const localOverlapLeft: number|undefined = pullUtil.calculateOverlap(boxRect, pulledRect, {x: -1, y: 0})
			if (localOverlapLeft && (!overlapLeft || localOverlapLeft > overlapLeft)) {
				overlapLeft = localOverlapLeft
			}
			const marginLeft: number|undefined = pullUtil.calculateDistance(boxRect, pulledRect, {x: -1, y: 0})
			if (marginLeft && boxRect.x-marginLeft > minX) {
				minX = boxRect.x-marginLeft
			}
			const localOverlapRight: number|undefined = pullUtil.calculateOverlap(boxRect, pulledRect, {x: 1, y: 0})
			if (localOverlapRight && (!overlapRight || localOverlapRight > overlapRight)) {
				overlapRight = localOverlapRight
			}
			const marginRight: number|undefined = pullUtil.calculateDistance(boxRect, pulledRect, {x: 1, y: 0})
			if (marginRight && boxRect.getRightX()+marginRight < maxX) {
				maxX = boxRect.getRightX()+marginRight
			}
			const localOverlapTop: number|undefined = pullUtil.calculateOverlap(boxRect, pulledRect, {x: 0, y: -1})
			if (localOverlapTop && (!overlapTop || localOverlapTop > overlapTop)) {
				overlapTop = localOverlapTop
			}
			const marginTop: number|undefined = pullUtil.calculateDistance(boxRect, pulledRect, {x: 0, y: -1})
			if (marginTop && boxRect.y-marginTop > minY) {
				minX = boxRect.y-marginTop
			}
			const localOverlapBottom: number|undefined = pullUtil.calculateOverlap(boxRect, pulledRect, {x: 0, y: 1})
			if (localOverlapBottom && (!overlapBottom || localOverlapBottom > overlapBottom)) {
				overlapBottom = localOverlapBottom
			}
			const marginBottom: number|undefined = pullUtil.calculateDistance(boxRect, pulledRect, {x: 0, y: 1})
			if (marginBottom && boxRect.getBottomY()+marginBottom < maxY) {
				maxX = boxRect.getBottomY()+marginBottom
			}
		}))

		const overlaps: {direction: {x: number, y: number}, distance: number}[] = []
		if (overlapLeft) {
			overlaps.push({direction: {x: -1, y: 0}, distance: overlapLeft})
		}
		if (overlapTop) {
			overlaps.push({direction: {x: 0, y: -1}, distance: overlapTop})
		}
		if (overlapRight) {
			overlaps.push({direction: {x: 1, y: 0}, distance: overlapRight})
		}
		if (overlapBottom) {
			overlaps.push({direction: {x: 0, y: 1}, distance: overlapBottom})
		}
		if (overlaps.length < 1) {
			return
		}
		overlaps.sort((a, b) => a.distance - b.distance)
		const xToMove: number|undefined = Math.min(overlapLeft?? Number.MAX_VALUE, overlapRight?? Number.MAX_VALUE)
		const yToMove: number|undefined = Math.min(overlapTop?? Number.MAX_VALUE, overlapBottom?? Number.MAX_VALUE)
		const moveOptions: {direction: {x: number, y: number}, distance: number}[] = []
		
		let move: {x: number, y: number, zoom: number} | undefined = undefined
		let movedRect: ClientRect|undefined = undefined
		let boundingRect: ClientRect = ClientRect.fromPositions(new ClientPosition(minX, minY), new ClientPosition(maxX, maxY))
		for (const jink of jinks) {
			movedRect = new ClientRect(boxRect.x+jink.x, boxRect.y+jink.y , boxRect.width, boxRect.height)
			if (movedRect.isInsideOrEqual(boundingRect)) {
				move = {x: jink.x, y: jink.y, zoom: 1}
				break
			}
			if (jink.x > 0) {
				boundingRect = ClientRect.fromPositions(new ClientPosition(boxRect.x+jink.x, boundingRect.y), boundingRect.getBottomRightPosition())
			} else {
				boundingRect = ClientRect.fromPositions(boundingRect.getTopLeftPosition(), new ClientPosition(boxRect.getRightX()+jink.x, boundingRect.getBottomY()))
			}
			if (jink.y > 0) {
				boundingRect = ClientRect.fromPositions(new ClientPosition(boundingRect.x, boxRect.y+jink.y), boundingRect.getBottomRightPosition())
			} else {
				boundingRect = ClientRect.fromPositions(boundingRect.getTopLeftPosition(), new ClientPosition(boundingRect.getRightX(), boxRect.getBottomY()+jink.y))
			}
			if (pullUtil.shrinkRectToAspectRatio(boundingRect, movedRect.width/movedRect.height).getArea() > 200*100) {
				if (boundingRect.width < boxRect.width) {
					const zoom: number = boundingRect.width/boxRect.width
					move = {x: boundingRect.x-boxRect.x, y: boxRect.height - boxRect.height*zoom, zoom}
					break
				} else {
					const zoom: number = boundingRect.height/boxRect.height
					move = {x: boxRect.width - boxRect.width*zoom, y: boundingRect.y-boxRect.y, zoom}
					break
				}
			}
			move = undefined
			movedRect = undefined
		}
		if (!move && !!false) {
			for (const overlap of overlaps) {
				move = {x: -overlap.direction.x*overlap.distance, y: -overlap.direction.y*overlap.distance, zoom: 1}
				movedRect = new ClientRect(boxRect.x+move.x, boxRect.y+move.y , boxRect.width, boxRect.height)
				if (movedRect.isInsideOrEqual(boundingRect)) {
					break
				}
				move = undefined
				movedRect = undefined
			}
		}

		if (!move) {
			console.warn('PulledBoxes::zoomOutToDisjoinBox !move')
			return
		}

		const pulledBoxesWithRects: {pulledBox: PulledBox, rect: ClientRect}[] = await Promise.all(this.pulledBoxes.map(async pulledBox => ({pulledBox, rect: await pulledBox.box.getClientRect()})))
		const mapRect: ClientRect = await pullUtil.getMap().getMapClientRect()
		await pullUtil.getMap().zoomToFit([new ClientRect(mapRect.x-move.x, mapRect.y-move.y, mapRect.width/move.zoom, mapRect.height/move.zoom)], {marginInPercent: 0, transitionDurationInMS: 200})
		await Promise.all(pulledBoxesWithRects.map(({pulledBox, rect}) => pulledBox.detachToFitClientRect(rect, false)))
	}
}