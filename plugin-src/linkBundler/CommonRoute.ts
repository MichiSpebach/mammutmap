/**
 * pluginFacade not used in imports because
 * some imports could not be resolved when importing from '../dist/pluginFacade' and cause:
 * "TypeError: Class extends value undefined is not a constructor or null"
 * TODO fix this!
 */
import { Link } from '../../dist/core/link/Link'
import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'
import { Box } from '../../dist/core/box/Box'

export class CommonRoute {

	public constructor(
		public readonly links: Link[],
		public from: AbstractNodeWidget,
		public to: AbstractNodeWidget,
		public readonly length: number
	) {}

	public getEndLink(end: 'from'|'to'): Link {
		const endLink: Link|undefined = end === 'from'
			? this.links.at(0)
			: this.links.at(-1)
		if (!endLink) {
			console.warn(`CommonRoute::getEndLink(end: '${end}') links are empty`)
		}
		return endLink!
	}

	public getEndBox(end: 'from'|'to'): Box {
		const endNode: AbstractNodeWidget = this[end]
		const endBox: AbstractNodeWidget = endNode instanceof Box ? endNode : endNode.getParent()
		if (!(endBox instanceof Box)) {
			console.warn(`CommonRoute::getEndBox(end: '${end}') endNode.getParent() is not instance of Box`)
		}
		return endBox as Box
	}
}