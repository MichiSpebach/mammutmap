/**
 * pluginFacade not used in imports because
 * some imports could not be resolved when importing from '../dist/pluginFacade' and cause:
 * "TypeError: Class extends value undefined is not a constructor or null"
 * TODO fix this!
 */
import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'
import { RenderPriority } from '../../dist/core/RenderManager'
import { BoxWatcher } from '../../dist/core/box/BoxWatcher'
import { Link, LinkImplementation } from '../../dist/core/link/Link'
import { NodeWidget } from '../../dist/core/node/NodeWidget'

export class HighlightPropagatingLink extends LinkImplementation {

	public static getBundledWithIds(link: Link): string[] {
		return link.getData()['bundledWith']?? []
	}

	public static addBundledWith(link: Link, bundledWith: Link[]): void {
		this.addBundledWithIds(link, bundledWith.map(link => link.getId()))
	}

	public static addBundledWithIds(link: Link, bundledWithIds: string[]): void {
		if (!link.getData()['bundledWith']) {
			link.getData()['bundledWith'] = bundledWithIds
		} else {
			(link.getData()['bundledWith'] as string[]).push(...bundledWithIds)
		}
	}

	public static removeBundledWithId(link: Link, bundledWithId: string): void {
		const bundledWithIds: string[] = this.getBundledWithIds(link)
		const index: number = bundledWithIds.indexOf(bundledWithId)
		if (index < 0) {
			console.warn(`HighlightPropagatingLink.removeBundledWithId(link: '${link.describe()}', bundledWithId: '${bundledWithId}) bundledWithIds does not contain bundledWithId`)
			return
		}
		bundledWithIds.splice(index, 1)
	}

	public static async getEntangledLinks(link: Link, searchDirection: 'from'|'to'): Promise<Link[]> {
		if (!(link instanceof HighlightPropagatingLink)) {
			console.warn(`HighlightPropagatingLink.getEntangledLinks(link: '${link.describe()}', ..) link is not instanceof HighlightPropagatingLink`)
			return []
		}
		const entangledLinkIds: string[] = this.getBundledWithIds(link)
		if (entangledLinkIds.length < 1) {
			return [link] // TODO does not work if route is splittet with simple knots
		}

		const entangledLinks: Link[] = []
		const followUpLinks: Link[] = await link.getFollowUpLinks(searchDirection)
		/*const linksToFollow: Link[] = []
		for (const followUpLink of followUpLinks) {
			if (entangledLinkIds.includes(followUpLink.getId())) {
				entangledLinks.push(followUpLink)
			} else {
				linksToFollow.push(followUpLink)
			}
		}*/
		await Promise.all(followUpLinks.map(async (followUpLink: Link) => {
			const followUpLinkEntangledLinks: Link[] = await this.getEntangledLinks(followUpLink, searchDirection)
			await Promise.all(followUpLinkEntangledLinks.map(async followUpLinkEntangledLink => {
				if (!(followUpLinkEntangledLink instanceof HighlightPropagatingLink)) {
					console.warn(`HighlightPropagatingLink.getEntangledLinks(...) followUpLinkEntangledLink is not instanceof HighlightPropagatingLink`)
					return
				}
				const entangledLinkCandidates: Link[] = await followUpLinkEntangledLink.getFollowUpLinks(searchDirection)
				entangledLinks.push(...entangledLinkCandidates.filter(link => entangledLinkIds.includes(link.getId())))
			}))
		}))

		if (entangledLinkIds.length !== entangledLinks.length) {
			console.warn(`HighlightPropagatingLink.getEntangledLinks(...) entangledLinkIds.length !== entangledLinks.length`)
		}
		return entangledLinks
	}

	private async getFollowUpLinks(direction: 'from'|'to'): Promise<Link[]> {
		const target: {node: AbstractNodeWidget, watcher: BoxWatcher} = await this[direction].getTargetAndRenderIfNecessary()
		return direction === 'to'
			? target.node.borderingLinks.getOutgoing()
			: target.node.borderingLinks.getIngoing()
	}

	/*public static async getBundleRouteTree(link: Link, searchDirection: 'from'|'to'): RouteTree {
		// TODO
	}*/

	/*protected override async handleHoverOver(): Promise<void> {
		await Promise.all([
			super.handleHoverOut(),
			this.propagateHighlight('from', true),
			this.propagateHighlight('to', true)
		])
	}

	protected override async handleHoverOut(): Promise<void> {
		await Promise.all([
			super.handleHoverOut(),
			this.propagateHighlight('from', false),
			this.propagateHighlight('to', false)
		])
	}*/

	public override async renderWithOptions(options: {
		priority?: RenderPriority|undefined
		highlight?: boolean|undefined
		draggingInProgress?: boolean|undefined
		hoveringOver?: boolean|undefined
		propagationStep?: number
		propagationDirection?: 'from'|'to'
		bundledWith?: string[]
	}): Promise<void> {
		const pros: Promise<void>[] = []
		pros.push(super.renderWithOptions(options))

		if (options.propagationStep && options.propagationStep > 8) {
			console.warn(`HighlightPropagatingLink::renderWithOptions(...) max propagationStep of 8 exceeded`)
		} else if (options.highlight !== undefined) {
			if (!options.propagationDirection || options.propagationDirection === 'from') {
				pros.push(this.propagateHighlight({...options, propagationDirection: 'from', highlight: options.highlight}))
			}
			if (!options.propagationDirection || options.propagationDirection === 'to') {
				pros.push(this.propagateHighlight({...options, propagationDirection: 'to', highlight: options.highlight}))
			}
		}
		
		await Promise.all(pros)
	}

	public override async render(priority?: RenderPriority | undefined): Promise<void> {
		if (this['renderState'].isUnrendered() && this.getConnectedLinks().some(link => link.isHighlight())) {
			this['highlight'] = true
		}
		await super.render(priority)
	}

	private async propagateHighlight(options: {
		highlight: boolean
		propagationStep?: number
		propagationDirection: 'from'|'to'
		bundledWith?: string[]
	}): Promise<void> {
		const endNode: AbstractNodeWidget = this[options.propagationDirection].getDeepestRenderedWayPoint().linkable
		if (!(endNode instanceof NodeWidget)) {
			return
		}
		const propagationStep: number = (options.propagationStep??0) + 1
		const bundledWith: string[] = (options.bundledWith??[]).concat(this.getData()['bundledWith']??[])

		const connectedLinks: Link[] = options.propagationDirection === 'to'
			? endNode.borderingLinks.getOutgoing()
			: endNode.borderingLinks.getIngoing()
		const bundledWithLinks: Link[] = connectedLinks.filter(link => bundledWith.includes(link.getId()))
		const linksToPropagateTo: Link[] = bundledWithLinks.length > 0 ? bundledWithLinks : connectedLinks

		await Promise.all(linksToPropagateTo.filter(link => link.shouldBeRendered()).map(async link => {
			await (link as HighlightPropagatingLink).renderWithOptions({...options, propagationStep, bundledWith})
		}))
	}

	private getConnectedLinks(): Link[] {
		const connectedLinks: Link[] = []
		
		const from: AbstractNodeWidget = this.from.getDeepestRenderedWayPoint().linkable
		if (from instanceof NodeWidget) {
			connectedLinks.push(...from.borderingLinks.getAll())
		}
		const to: AbstractNodeWidget = this.to.getDeepestRenderedWayPoint().linkable
		if (to instanceof NodeWidget) {
			connectedLinks.push(...to.borderingLinks.getAll())
		}

		return connectedLinks
	}

}