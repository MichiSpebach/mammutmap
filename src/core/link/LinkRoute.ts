import { AbstractNodeWidget } from '../AbstractNodeWidget'
import { Box } from '../box/Box'
import { BoxWatcher } from '../box/BoxWatcher'
import { log } from '../logService'
import { Link } from './Link'
import { LinkEnd } from './LinkEnd'

export class LinkRoute {

	public readonly id: string|undefined
	public readonly links: Link[]
	public readonly nodes: {node: AbstractNodeWidget, watcher: BoxWatcher}[]

	public constructor(routeId: string|undefined, startLink: Link) {
		this.id = routeId
		this.links = [startLink]
		this.nodes = []
	}

	public async followAndWatch(): Promise<{origin: AbstractNodeWidget, destination: AbstractNodeWidget}> {
		const origin: Promise<AbstractNodeWidget> = this.followOriginAndWatch()
		const destination: Promise<AbstractNodeWidget> = this.followDestinationAndWatch()
		return {
			origin: await origin,
			destination: await destination
		}
	}

	public async unwatch(): Promise<void> {
		await Promise.all(this.nodes.map(node => node.watcher.unwatch()))
	}

	public async followOriginAndWatch(leftHops = 100): Promise<AbstractNodeWidget> {
		let origin = this.nodes.at(0)
		if (!origin || !this.links[0].from.isBoxInPath(origin.node)) {
			origin = await this.links[0].from.getTargetAndRenderIfNecessary()
			this.nodes.unshift(origin)
		}
		if (origin.node instanceof Box) {
			return origin.node
		}

		const followUpLink: Link|undefined = this.getFollowUpLink(origin.node.borderingLinks.getIngoing(), origin.node)
		if (!followUpLink) {
			return origin.node
		}
		this.links.unshift(followUpLink)
		origin = await followUpLink.from.getTargetAndRenderIfNecessary()
		this.nodes.unshift(origin)

		if (leftHops < 0) {
			log.warning((`LinkRoute::followOrigin() most likely cycle, leftHops < 0 for route with id '${this.id}' at node '${origin.node.getName()}'`))
			return origin.node
		}
		return this.followOriginAndWatch(leftHops--)
	}

	public async followDestinationAndWatch(leftHops = 100): Promise<AbstractNodeWidget> {
		let destination = this.nodes.at(-1)
		if (!destination || !this.links[this.links.length-1].to.isBoxInPath(destination.node)) {
			destination = await this.links[this.links.length-1].to.getTargetAndRenderIfNecessary()
			this.nodes.push(destination)
		}
		if (destination.node instanceof Box) {
			return destination.node
		}
		
		const followUpLink: Link|undefined = this.getFollowUpLink(destination.node.borderingLinks.getOutgoing(), destination.node)
		if (!followUpLink) {
			return destination.node
		}
		this.links.push(followUpLink)
		destination = await followUpLink.to.getTargetAndRenderIfNecessary()
		this.nodes.push(destination)
		
		if (leftHops < 0) {
			log.warning((`LinkRoute::followDestination() most likely cycle, leftHops < 0 for route with id '${this.id}' at node '${destination.node.getName()}'`))
			return destination.node
		}
		return this.followDestinationAndWatch(leftHops--)
	}

	private getFollowUpLink(borderingLinks: Link[], node: AbstractNodeWidget): Link|undefined {
		if (borderingLinks.length === 0) {
			return undefined
		}
		const routeId: string|undefined = this.id
		const followUpLinks: Link[] = routeId
			? borderingLinks.filter(link => link.getData().routes?.includes(routeId))
			: borderingLinks.filter(link => !link.getData().routes || link.getData().routes?.length === 0)
		if (followUpLinks.length < 1) {
			log.warning(`LinkRoute::getFollowUpLink() followUpLinks is empty for route with id '${routeId}' at node '${node.getName()}'`)
			return undefined
		}
		if (followUpLinks.length > 1) {
			log.warning(`LinkRoute::getFollowUpLink() there is more than one followUpLink for route with id '${routeId}' at node '${node.getName()}'`)
		}
		return followUpLinks[0]
	}

	public findLinkEndBorderingNode(node: AbstractNodeWidget): LinkEnd|undefined {
		for (const link of this.links) {
			if (link.from.isBoxInPath(node)) {
				return link.from
			}
			if (link.to.isBoxInPath(node)) {
				return link.to
			}
		}
		return undefined
	}
}