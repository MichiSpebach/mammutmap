/**
 * pluginFacade not used in imports because
 * some imports could not be resolved when importing from '../dist/pluginFacade' and cause:
 * "TypeError: Class extends value undefined is not a constructor or null"
 * TODO fix this!
 */
import { Link } from '../../src/core/link/Link'
import { AbstractNodeWidget } from '../../src/core/AbstractNodeWidget'
import { Box } from '../../src/core/box/Box'
import { NodeWidget } from '../../src/pluginFacade'

export class CommonRoute {

	public static newFromCopy(commonRoute: CommonRoute): CommonRoute {
		return new CommonRoute(
			[...commonRoute.links],
			[...commonRoute.knots],
			commonRoute.from,
			commonRoute.to,
			commonRoute.length
		)
	}

	public constructor(
		public readonly links: Link[],
		private readonly knots: NodeWidget[],
		private from: AbstractNodeWidget,
		private to: AbstractNodeWidget,
		private length: number
	) {}

	public getEndLink(end: 'from'|'to'): Link {
		const endLink: Link|undefined = end === 'to'
			? this.links.at(-1)
			: this.links.at(0)
		if (!endLink) {
			console.warn(`CommonRoute::getEndLink(end: '${end}') links are empty`)
		}
		return endLink!
	}

	public getEndKnot(end: 'from'|'to'): NodeWidget {
		const endKnot: NodeWidget|undefined = end === 'to'
			? this.knots.at(-1)
			: this.knots.at(0)
		if (!endKnot) {
			console.warn(`CommonRoute::getEndKnot(end: '${end}') knots are empty`)
		}
		return endKnot!
	}

	public getFrom(): AbstractNodeWidget {
		return this.from
	}

	public getTo(): AbstractNodeWidget {
		return this.to
	}

	public getEndBox(end: 'from'|'to'): Box {
		const endNode: AbstractNodeWidget = this[end]
		const endBox: AbstractNodeWidget = endNode instanceof Box ? endNode : endNode.getParent()
		if (!(endBox instanceof Box)) {
			console.warn(`CommonRoute::getEndBox(end: '${end}') endNode.getParent() is not instance of Box`)
		}
		return endBox as Box
	}

	public countEndKnots(): number {
		let count = 0
		if (this.from instanceof NodeWidget) {
			count++
		}
		if (this.to instanceof NodeWidget) {
			count++
		}
		return count
	}

	/** TODO: rename to getTraversingBoxCount()? */
	public getLength(): number {
		return this.length
	}

	public elongateWithLink(end: 'from'|'to', connectingKnot: NodeWidget, link: Link, farthestCommonWaypointOfLink: AbstractNodeWidget): void {
		if (end === 'to') {
			this.links.push(link)
			this.knots.push(connectingKnot)
			this.to = farthestCommonWaypointOfLink
		} else {
			this.links.unshift(link)
			this.knots.unshift(connectingKnot)
			this.from = farthestCommonWaypointOfLink
		}
		this.length++
	}

	public elongateWithWaypoint(end: 'from'|'to', waypoint: AbstractNodeWidget, options?: {noLengthIncrement?: boolean}): void {
		if (end === 'to') {
			if (waypoint instanceof NodeWidget) {
				this.knots.push(waypoint)
			} else {
				//this.length++ // TODO: use this line, it should be about the number of boxes that are traversed
			}
			this.to = waypoint
		} else {
			if (waypoint instanceof NodeWidget) {
				this.knots.unshift(waypoint)
			} else {
				//this.length++ // TODO: use this line, it should be about the number of boxes that are traversed
			}
			this.from = waypoint
		}
		if (!options?.noLengthIncrement) {
			this.length++ // TODO: remove this line
		}
	}

	public addLink(end: 'from'|'to', link: Link): void {
		end === 'to'
			? this.links.push(link)
			: this.links.unshift(link)
	}
}