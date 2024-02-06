import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'
import { Link, LinkImplementation, NodeWidget, RenderPriority } from '../../dist/pluginFacade'

export class HighlightPropagatingLink extends LinkImplementation {

	public static getBundledWithIds(link: Link): string[] {
		return link.getData()['bundledWith']?? []
	}

	public static addBundledWith(link: Link, bundledWith: Link[]): void {
		if (!link.getData()['bundledWith']) {
			link.getData()['bundledWith'] = bundledWith.map(link => link.getId())
		} else {
			(link.getData()['bundledWith'] as string[]).push(...bundledWith.map(link => link.getId()))
		}
	}

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

		if (options.highlight !== undefined) {
			//this['highlight'] = options.highlight
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