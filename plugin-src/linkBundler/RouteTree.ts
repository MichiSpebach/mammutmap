import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'
import { BoxWatcher } from '../../dist/core/box/BoxWatcher'
import { Link } from '../../dist/core/link/Link'
import { HighlightPropagatingLink } from './HighlightPropagatingLink'

export class RouteTree {
	
	public constructor(
		public readonly start: Link/*End TODO?*/,
		public readonly direction: 'from'|'to'
	) {}
	
	private readonly watchers: BoxWatcher[] = []

	public async getEntangledLinks(): Promise<Link[]> {
		return this.followLinkRecursively(this.start, [])
	}
	
	private async followLinkRecursively(link: Link, linksToFollowIds: string[]): Promise<Link[]> {
		const followUpLinks: Link[] = await this.getFollowUpLinks(link)
		const linksToFind: Link[] = []
		await Promise.all(followUpLinks.map(async followUpLink => {
			if (this.getLinksToFindIds().includes(followUpLink.getId())) {
				linksToFind.push(followUpLink)
				return
			}
			const entangledLinkIds: string[] = HighlightPropagatingLink.getBundledWithIds(followUpLink)
			if (entangledLinkIds.length < 1 || linksToFollowIds.includes(followUpLink.getId())) {
				linksToFind.push(...await this.followLinkRecursively(followUpLink, linksToFollowIds.concat(entangledLinkIds)))
				//linksToFind.push(...await new RouteTreeDirection(followUpLink, this.direction, this.linksToFollowIds.concat(entangledLinkIds), this.linksToFindIds).getEntangledLinks())
			}
		}))
		return linksToFind
	}

	private getLinksToFindIds(): string[] {
		return HighlightPropagatingLink.getBundledWithIds(this.start)
	}

	private async getFollowUpLinks(link: Link): Promise<Link[]> {
		const target: {node: AbstractNodeWidget, watcher: BoxWatcher} = await link[this.direction].getTargetAndRenderIfNecessary()
		return this.direction === 'to'
			? target.node.borderingLinks.getOutgoing()
			: target.node.borderingLinks.getIngoing()
	}
}