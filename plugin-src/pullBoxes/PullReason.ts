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
		if (await box.isZoomedIn()) {
			return true
		}
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

	public async calculatePullPositionFor(box: Box): Promise<ClientPosition> {
		const linkEndBorderingBox: LinkEnd|undefined = this.route.findLinkEndBorderingNode(box)
		if (!linkEndBorderingBox) {
			console.warn(`PulledBoxes::pullBoxIfNecessary(box: ${box.getName()}) !linkEndBorderingBox`)
			return (await pullUtil.getIntersectionRect()).getMidPosition()
		}
		const direction: 'from'|'to' = linkEndBorderingBox.getReferenceLink().from === linkEndBorderingBox ? 'to' : 'from'

		if (await this.isLinkEndOutsideScreen(linkEndBorderingBox)) {
			return await this.calculatePullPositionOfRoute(this.route, direction)
		}
		
		let pullPosition = (await box.getClientRect()).getMidPosition()
		const intersectionRect: ClientRect = await pullUtil.getIntersectionRect()
		if (!intersectionRect.isPositionInside(pullPosition)) {	// TODO: hack only, improve
			const position: ClientPosition|undefined = await this.calculatePullPositionOfLink(linkEndBorderingBox, {elongationInPixels: 10000})
			if (position) {
				pullPosition = position
			} else {
				console.warn(`pullBoxes.pullInBoxPathIfNecessary(box ${box.getSrcPath()}, reason)`)
			}
		}
		return pullPosition
	}

	public async calculatePullPositionOfRoute(linkRoute: LinkRoute, direction: 'from'|'to'): Promise<ClientPosition> {
		const startIndex: number = direction === 'to' ? 0 : linkRoute.links.length-1
		const increment: number = direction === 'to' ? 1 : -1
		for (let i = startIndex; i < linkRoute.links.length && i >= 0; i += increment) {
			const link: Link = linkRoute.links[i]
			const pullPosition: ClientPosition|undefined = await this.calculatePullPositionOfLink(link[direction])
			if (pullPosition) {
				return pullPosition
			}
		}
		const pullPosition: ClientPosition|undefined = await this.calculatePullPositionOfLink(linkRoute.links[startIndex][direction], {elongationInPixels: 10000}) // TODO: hack only, improve
		if (pullPosition) {
			return pullPosition
		}
		console.warn(`pullBoxes: intersections.length < 1 for linkRoute [${linkRoute.nodes.map(node => node.node.getName())}]`)
		return (await pullUtil.getIntersectionRect()).getMidPosition()
	}
	
	public async calculatePullPositionOfLink(linkEnd: LinkEnd, options?: {elongationInPixels?: number}): Promise<ClientPosition|undefined> {
		const linkEndPosition: Promise<ClientPosition> = linkEnd.getRenderPositionInClientCoords()
		const otherLinkEndPosition: Promise<ClientPosition> = linkEnd.getOtherEnd().getRenderPositionInClientCoords()
		let linkLine = new Line(await linkEndPosition, await otherLinkEndPosition)
		if (options?.elongationInPixels) {
			linkLine = linkLine.elongate(options.elongationInPixels)
		}
		const intersectionRect: ClientRect = await pullUtil.getIntersectionRect()
		const intersections: ClientPosition[] = intersectionRect.calculateIntersectionsWithLine(linkLine)
		if (intersections.length < 1) {
			return undefined
		}
		let intersection: ClientPosition = intersections[0]
		if (intersections.length > 1) {
			for (let i = 1; i < intersections.length; i++) {
				if (intersections[i].calculateDistanceTo(await linkEndPosition) < intersection.calculateDistanceTo(await linkEndPosition)) {
					intersection = intersections[i]
				}
			}
		}
		return intersection
	}
}
