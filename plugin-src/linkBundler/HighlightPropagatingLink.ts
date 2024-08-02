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

	public static getRouteIds(link: Link): string[] {
		return link.getData()['routes']?? []
	}

	public static addRoutes(link: Link, routeIds: string[]): void {
		if (!link.getData()['routes']) {
			link.getData()['routes'] = []
		}
		(link.getData()['routes'] as string[]).push(...routeIds)
	}

	public static addRoute(link: Link, routeId: string): void {
		if (!link.getData()['routes']) {
			link.getData()['routes'] = []
		}
		(link.getData()['routes'] as string[]).push(routeId)
	}

	public static removeRoute(link: Link, routeId: string): void {
		const routeIds: string[] = this.getRouteIds(link)
		const index: number = routeIds.indexOf(routeId)
		if (index < 0) {
			console.warn(`HighlightPropagatingLink.removeRoute(link: '${link.describe()}', routeId: '${routeId}) routeIds does not contain routeId`)
			return
		}
		routeIds.splice(index, 1)
	}

	public static getBundledWithIds(link: Link): string[] {
		return link.getData()['bundledWith']?? []
	}

	public static addBundledWith(link: Link, bundledWith: Link[]): void {
		this.addBundledWithIds(link, bundledWith.map(link => link.getId()))
	}

	public static addBundledWithIds(link: Link, bundledWithIds: string[]): void {
		if (!link.getData()['bundledWith']) {
			link.getData()['bundledWith'] = []
		}
		const bundledWithData: string[] = link.getData()['bundledWith'] as string[]
		for (const bundledWithId of bundledWithIds) {
			if (!bundledWithData.includes(bundledWithId)) {
				bundledWithData.push(bundledWithId)
			}
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

	public static async getRouteAndRenderIfNecessary(link: Link): Promise<{link: Link, watcher: BoxWatcher}[]> {
		const route: {link: Link, watcher: BoxWatcher}[] = [{link, watcher: await BoxWatcher.newAndWatch(link.getManagingBox())}]
		await Promise.all([
			this.elongateRouteToStart(route, this.getRouteIds(link)),
			this.elongateRouteToEnd(route, this.getRouteIds(link))
		])

		for (const routeLink of route) {
			for (const linkRouteId of this.getRouteIds(link)) {	
				if (!this.getRouteIds(routeLink.link).includes(linkRouteId)) {
					console.warn(`HighlightPropagatingLink.getRouteAndRenderIfNecessary(link: "${link.describe()}") routeId '${linkRouteId}' is not included in link with id '${routeLink.link.getId()}'`)
				}
			}
		}

		return route
	}

	private static async elongateRouteToStart(route: {link: Link, watcher: BoxWatcher}[], routeIds: string[]): Promise<void> {
		while (true) {
			const target: {node: AbstractNodeWidget, watcher: BoxWatcher} = await route[0].link.from.getTargetAndRenderIfNecessary()
			if (!(target.node instanceof NodeWidget)) {
				await target.watcher.unwatch()
				return
			}
			const precursor: Link|undefined = this.elongateRouteFilterConnectedLinks(route, routeIds, target.node.borderingLinks.getIngoing())
			if (!precursor) {
				await target.watcher.unwatch()
				return
			}
			route.unshift({link: precursor, watcher: target.watcher})
		}
	}

	private static async elongateRouteToEnd(route: {link: Link, watcher: BoxWatcher}[], routeIds: string[]): Promise<void> {
		while (true) {
			const target: {node: AbstractNodeWidget, watcher: BoxWatcher} = await route[route.length-1].link.to.getTargetAndRenderIfNecessary()
			if (!(target.node instanceof NodeWidget)) {
				await target.watcher.unwatch()
				return
			}
			const successor: Link|undefined = this.elongateRouteFilterConnectedLinks(route, routeIds, target.node.borderingLinks.getOutgoing())
			if (!successor) {
				await target.watcher.unwatch()
				return
			}
			route.push({link: successor, watcher: target.watcher})
		}
	}

	private static elongateRouteFilterConnectedLinks(route: {link: Link}[], routeIds: string[], connectedLinks: Link[]): Link|undefined {
		if (connectedLinks.length === 1) {
			if (!this.includesAllRouteIds(connectedLinks[0], routeIds)) {
				console.warn(`HighlightPropagatingLink.elongateRouteFilterConnectedLinks(route: ["${route[0].link.describe()}", .., "${route[route.length-1].link.describe()}"], ..) !this.includesAllRouteIds(connections[0], routeIds)`)
			}
		} else if (connectedLinks.length > 1) {
			connectedLinks = connectedLinks.filter((connection: Link) => this.includesAllRouteIds(connection, routeIds))
			if (connectedLinks.length > 1) {
				console.warn(`HighlightPropagatingLink.elongateRouteFilterConnectedLinks(route: ["${route[0].link.describe()}", .., "${route[route.length-1].link.describe()}"], ..) connectedLinks.length > 1`)
			}
		}
		if (connectedLinks.length === 0) {
			return undefined
		}
		for (const routeLink of route) {
			if (routeLink.link === connectedLinks[0]) {
				console.warn(`HighlightPropagatingLink.elongateRouteFilterConnectedLinks(route: ["${route[0].link.describe()}", .., "${route[route.length-1].link.describe()}"], ..) detected cyle`)
				return undefined
			}
		}
		return connectedLinks[0]
	}

	private static includesAllRouteIds(link: Link, routeIds: string[]): boolean {
		const includedRouteIds: string[] = routeIds.filter(routeId => this.getRouteIds(link).includes(routeId))
		if (includedRouteIds.length === routeIds.length) {
			return true
		}
		if (includedRouteIds.length < 1) {
			console.warn(`HighlightPropagatingLink.includesAllRouteIds(link: "${link.describe()}", routeIds: ${routeIds}) expected at least one routeId to be included in link`)
		}
		return false
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
		highlightRouteIds?: string[]
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
			const highlightRouteIds: string[] = options.highlightRouteIds?? HighlightPropagatingLink.getRouteIds(this)
			if (!options.propagationDirection || options.propagationDirection === 'from') {
				pros.push(this.propagateHighlight({...options, propagationDirection: 'from', highlight: options.highlight, highlightRouteIds}))
			}
			if (!options.propagationDirection || options.propagationDirection === 'to') {
				pros.push(this.propagateHighlight({...options, propagationDirection: 'to', highlight: options.highlight, highlightRouteIds}))
			}
		}
		
		await Promise.all(pros)
	}

	public override async render(priority?: RenderPriority | undefined): Promise<void> {
		if (this['renderState'].isUnrendered() && this.getConnectedLinks().some(link => link.isHighlight())) { // TODO: this.getConnectedLinks() does not always return the correct links
			this['highlight'] = true
		}
		await super.render(priority)
	}

	private async propagateHighlight(options: {
		highlight: boolean
		highlightRouteIds: string[]
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
		const entangledLinksToPropagateTo: Link[] = bundledWithLinks.length > 0 ? bundledWithLinks : connectedLinks
		const routedLinksToPropagateTo: Link [] = connectedLinks.filter(link => {
			const routeIds: string[] = HighlightPropagatingLink.getRouteIds(link)
			if (routeIds.length < 1 &&  options.highlightRouteIds.length < 1) {
				return true
			}
			return options.highlightRouteIds.some(highlightRouteId => routeIds.includes(highlightRouteId))
		})
		if (bundledWithLinks.length > 0) {
			if (!entangledLinksToPropagateTo.every(link => routedLinksToPropagateTo.includes(link)) || !routedLinksToPropagateTo.every(link => entangledLinksToPropagateTo.includes(link))) {
				console.warn(`entangledLinksToPropagateTo and routedLinksToPropagateTo include different links:\nentangledLinksToPropagateTo=${entangledLinksToPropagateTo.map(link => link.getId())} but\nroutedLinksToPropagateTo=${routedLinksToPropagateTo.map(link => link.getId())}`)
			}
		}

		await Promise.all(routedLinksToPropagateTo.filter(link => link.shouldBeRendered()).map(async link => {
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