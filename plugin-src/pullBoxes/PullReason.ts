import { Link } from '../../dist/core/link/Link'
import { Box } from '../../dist/core/box/Box'
import { LinkRoute } from '../../dist/core/link/LinkRoute'
import { ClientRect } from '../../dist/core/ClientRect'
import * as pullUtil from './pullUtil'
import { ClientPosition } from '../../dist/core/shape/ClientPosition'
import { LinkEnd } from '../../dist/core/link/LinkEnd'
import { Line } from '../../dist/core/shape/Line'

export class PullReason {
	public constructor(
		public readonly reason: Link|Box,
		public readonly route: LinkRoute
	) {}

	public async shouldNotPullBox(box: Box): Promise<boolean> {
		const boxRect: ClientRect = await box.getClientRect()
		const mapRect: ClientRect = await pullUtil.getUncoveredMapClientRect()
		return boxRect.isInsideOrEqual(mapRect) && (await box.getClientRect()).getArea() > 100*100
	}
	
	public async isLinkEndOutsideScreen(linkEnd: LinkEnd): Promise<boolean> {
		const position: ClientPosition = await linkEnd.getRenderPositionInClientCoords()
		const rect: ClientRect = await pullUtil.getIntersectionRect()
		return !rect.isPositionInside(position)
	}
	
	public createPullRect(midPosition: ClientPosition): ClientRect {
		return new ClientRect(midPosition.x-100, midPosition.y-50, 200, 100)
	}

	public async calculatePullPositionFor(box: Box): Promise<{position: ClientPosition, direction: {x: number, y: number}}> {
		const linkEndBorderingBox: LinkEnd|undefined = this.route.findLinkEndBorderingNode(box)
		if (!linkEndBorderingBox) {
			console.warn(`PulledBoxes::pullBoxIfNecessary(box: ${box.getName()}) !linkEndBorderingBox`)
			return {position: (await pullUtil.getIntersectionRect()).getMidPosition(), direction: {x: 1, y: 0}}
		}
		const direction: 'from'|'to' = linkEndBorderingBox.getReferenceLink().from === linkEndBorderingBox ? 'to' : 'from'

		if (await this.isLinkEndOutsideScreen(linkEndBorderingBox)) {
			return await this.calculatePullPositionOfRoute(direction)
		}
		
		const otherLinkEndPosition: Promise<ClientPosition> = linkEndBorderingBox.getOtherEnd().getTargetPositionInClientCoords()
		const linkEndPosition: Promise<ClientPosition> = linkEndBorderingBox.getTargetPositionInClientCoords()
		const pullDirection: {x: number, y: number} = new Line(await otherLinkEndPosition, await linkEndPosition).getDirection()
		
		const boxPosition = (await box.getClientRect()).getMidPosition()
		let pullPosition = {position: boxPosition, direction: pullDirection}
		const intersectionRect: ClientRect = await pullUtil.getIntersectionRect()
		if (!intersectionRect.isPositionInside(boxPosition)) {	// TODO: hack only, improve
			const position: {position: ClientPosition, direction: {x: number, y: number}} | undefined = await this.calculateIntersectionOfLinkWithRect(linkEndBorderingBox, intersectionRect, {elongationInPixels: 10000})
			if (position) {
				pullPosition = position
			} else {
				console.warn(`pullBoxes.pullInBoxPathIfNecessary(box ${box.getSrcPath()}, reason)`)
			}
		}
		return pullPosition
	}

	public async calculatePullPositionOfRoute(direction: 'from'|'to'): Promise<{position: ClientPosition, direction: {x: number, y: number}}> {
		let intersection: {position: ClientPosition, direction: {x: number, y: number}} | undefined = await this.calculateIntersectionOfRouteWithRect(await pullUtil.getIntersectionRect(), {direction, elongateInDirection: true})
		if (!intersection) {
			console.warn(`pullBoxes: intersections.length < 1 for linkRoute [${this.route.nodes.map(node => node.node.getName())}]`)
			intersection = {position: (await pullUtil.getIntersectionRect()).getMidPosition(), direction: {x: 1, y: 0}}
		}
		return intersection
	}
	
	public async calculateIntersectionOfRouteWithRect(rect: ClientRect, options?: {
		direction?: 'from'|'to'
		elongateInDirection?: boolean
		warnIfMultipleIntersectionsWithOneLink?: boolean}
	): Promise<{position: ClientPosition, direction: {x: number, y: number}} | undefined> {
		const direction: 'from'|'to' = options?.direction?? 'to'
		const startIndex: number = direction === 'to' ? 0 : this.route.links.length-1
		const increment: number = direction === 'to' ? 1 : -1
		let intersection: {position: ClientPosition, direction: {x: number, y: number}} | undefined = undefined
		for (let i = startIndex; i < this.route.links.length && i >= 0; i += increment) {
			const link: Link = this.route.links[i]
			if (intersection) {
				console.warn(`PullReason::calculateIntersectionOfRouteWithRect(rect: ${JSON.stringify(rect)}, options: ${JSON.stringify(options)}) multiple intersections in route with link ids [${this.route.links.map(link => `'${link.getId()}'`)}]`)
			}
			intersection = await this.calculateIntersectionOfLinkWithRect(link[direction], rect, {warnIfMultipleIntersections: options?.warnIfMultipleIntersectionsWithOneLink})
		}
		if (!intersection && options?.elongateInDirection) { // TODO: hack only, improve
			intersection = await this.calculateIntersectionOfLinkWithRect(this.route.links[startIndex][direction], rect, {elongationInPixels: 10000, warnIfMultipleIntersections: options.warnIfMultipleIntersectionsWithOneLink})
		}
		return intersection
	}
	
	private async calculateIntersectionOfLinkWithRect(linkEnd: LinkEnd, rect: ClientRect, options?: {
		elongationInPixels?: number,
		warnIfMultipleIntersections?: boolean}
	): Promise<{position: ClientPosition, direction: {x: number, y: number}} | undefined> {
		const linkEndPosition: Promise<ClientPosition> = linkEnd.getTargetPositionInClientCoords()
		const otherLinkEndPosition: Promise<ClientPosition> = linkEnd.getOtherEnd().getTargetPositionInClientCoords()
		let linkLine = new Line(await linkEndPosition, await otherLinkEndPosition)
		if (options?.elongationInPixels) {
			linkLine = linkLine.elongate(options.elongationInPixels)
		}
		
		const intersections: ClientPosition[] = rect.calculateIntersectionsWithLine(linkLine)
		if (intersections.length < 1) {
			return undefined
		}
		let intersection: ClientPosition = intersections[0]
		if (intersections.length > 1) {
			if (options?.warnIfMultipleIntersections) {
				console.warn(`PullReason::calculateIntersectionOfLinkWithRect(linkEnd: ${linkEnd.getId()}, rect: ${JSON.stringify(rect)}, options: ${JSON.stringify(options)}) multiple intersections, returning nearest to linkEnd`)
			}
			for (let i = 1; i < intersections.length; i++) {
				if (intersections[i].calculateDistanceTo(await linkEndPosition) < intersection.calculateDistanceTo(await linkEndPosition)) {
					intersection = intersections[i]
				}
			}
		}
		return {position: intersection, direction: linkLine.getDirection()}
	}
}
