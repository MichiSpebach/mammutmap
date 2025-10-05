import { AbstractNodeWidget } from '../../src/core/AbstractNodeWidget'
import { BoxWatcher } from '../../src/core/box/BoxWatcher'
import { Link } from '../../src/core/link/Link'
import { NodeWidget } from '../../src/pluginFacade'
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
	
	private async followLinkRecursively(link: Link, linksToFollowIds: string[], recursionsLeft: number = 32): Promise<{links: Link[], watchers: BoxWatcher[]}> {
		if (recursionsLeft < 0) {
			console.warn(`RouteTree::followLinkRecursively(link: "${link.describe()}") link is part of a cycle or a very long route.`)
			return {links: [], watchers: []}
		}

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
				const recursiveFollowUps = await this.followLinkRecursively(followUpLink, linksToFollowIds.concat(entangledLinkIds), recursionsLeft-1)
				//const recursiveFollowUps = await new RouteTreeDirection(followUpLink, this.direction, this.linksToFollowIds.concat(entangledLinkIds), this.linksToFindIds).getEntangledLinks() // TODO: handle infinite loop for cycles
				linksToFind.push(...recursiveFollowUps.links)
				watchers.push(...recursiveFollowUps.watchers)
			}
		}))
		return {links: linksToFind, watchers}
	}

	private getLinksToFindIds(): string[] {
		return HighlightPropagatingLink.getBundledWithIds(this.start)
	}

	private async getFollowUpLinks(link: Link): Promise<{links: Link[], watcher: BoxWatcher}> {
		const target: {node: AbstractNodeWidget, watcher: BoxWatcher} = await link[this.direction].getTargetAndRenderIfNecessary()
		if (!(target.node instanceof NodeWidget)) {
			return {links: [], watcher: target.watcher}
		}
		const links: Link[] = this.direction === 'to'
			? target.node.borderingLinks.getOutgoing()
			: target.node.borderingLinks.getIngoing()
		return {links, watcher: target.watcher}
	}
}