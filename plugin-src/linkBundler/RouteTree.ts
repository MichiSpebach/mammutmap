import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'
import { BoxWatcher } from '../../dist/core/box/BoxWatcher'
import { Link } from '../../dist/core/link/Link'
import { HighlightPropagatingLink } from './HighlightPropagatingLink'

export class RouteTree {
	
	public constructor(
		public readonly start: Link/*End TODO?*/,
		public readonly direction: 'from'|'to'
	) {}

	public async getEntangledLinks(): Promise<{links: Link[], watchers: BoxWatcher[]}> {
		const entangledLinks: {links: Link[], watchers: BoxWatcher[]} = await this.followLinkRecursively(this.start, [])
		if (entangledLinks.links.length !== this.getLinksToFindIds().length) {
			console.warn(`RouteTree::getEntangledLinks() found only ${entangledLinks.links.length} of ${this.getLinksToFindIds().length} entangledLinks for ${this.start.describe()}.`)
		}
		return entangledLinks
	}
	
	private async followLinkRecursively(link: Link, linksToFollowIds: string[]): Promise<{links: Link[], watchers: BoxWatcher[]}> {
		const followUps: {links: Link[], watcher: BoxWatcher} = await this.getFollowUpLinks(link)
		const linksToFind: Link[] = []
		const watchers: BoxWatcher[] = [followUps.watcher]
		await Promise.all(followUps.links.map(async followUpLink => {
			if (this.getLinksToFindIds().includes(followUpLink.getId())) {
				linksToFind.push(followUpLink)
				return
			}
			const entangledLinkIds: string[] = HighlightPropagatingLink.getBundledWithIds(followUpLink)
			if (entangledLinkIds.length < 1 || linksToFollowIds.includes(followUpLink.getId())) {
				const recursivelyFollowUps = await this.followLinkRecursively(followUpLink, linksToFollowIds.concat(entangledLinkIds)) // TODO: handle infinite loop for cycles
				//const recursivelyFollowUps = await new RouteTreeDirection(followUpLink, this.direction, this.linksToFollowIds.concat(entangledLinkIds), this.linksToFindIds).getEntangledLinks() // TODO: handle infinite loop for cycles
				linksToFind.push(...recursivelyFollowUps.links)
				watchers.push(...recursivelyFollowUps.watchers)
			}
		}))
		return {links: linksToFind, watchers}
	}

	private getLinksToFindIds(): string[] {
		return HighlightPropagatingLink.getBundledWithIds(this.start)
	}

	private async getFollowUpLinks(link: Link): Promise<{links: Link[], watcher: BoxWatcher}> {
		const target: {node: AbstractNodeWidget, watcher: BoxWatcher} = await link[this.direction].getTargetAndRenderIfNecessary()
		const links: Link[] = this.direction === 'to'
			? target.node.borderingLinks.getOutgoing()
			: target.node.borderingLinks.getIngoing()
		return {links, watcher: target.watcher}
	}
}