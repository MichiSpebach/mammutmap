import { Box } from '../../dist/core/box/Box'
import { NodeWidget } from '../../dist/pluginFacade'
import { LayerSide, Suggestion } from './LayerSide'
import { NodeToOrder } from './NodeToOrder'

export class Layer {
	public nodes: NodeToOrder[]
	public top: LayerSide
	public right: LayerSide
	public bottom: LayerSide
	public left: LayerSide

	public constructor(nodes: NodeToOrder[]) {
		this.nodes = nodes
		const classifiedNodes = this.classifyNodes()
		this.top = new LayerSide('top', classifiedNodes.topNodes)
		this.right = new LayerSide('right', classifiedNodes.rightNodes)
		this.bottom = new LayerSide('bottom', classifiedNodes.bottomNodes)
		this.left = new LayerSide('left', classifiedNodes.leftNodes)
	}

	private classifyNodes(): {topNodes: NodeToOrder[], rightNodes: NodeToOrder[], bottomNodes: NodeToOrder[], leftNodes: NodeToOrder[]} {
		const topNodes: NodeToOrder[] = []
		const rightNodes: NodeToOrder[] = []
		const bottomNodes: NodeToOrder[] = []
		const leftNodes: NodeToOrder[] = []

		for (const node of this.nodes) {
			if (node.wishPosition.percentX < 50) {
				if (node.wishPosition.percentY < node.wishPosition.percentX) {
					topNodes.push(node)
					continue
				}
				if (node.wishPosition.percentY > 100-node.wishPosition.percentX) {
					bottomNodes.push(node)
					continue
				}
				leftNodes.push(node)
				continue
			}
			if (node.wishPosition.percentY < 100-node.wishPosition.percentX) {
				topNodes.push(node)
				continue
			}
			if (node.wishPosition.percentY > node.wishPosition.percentX) {
				bottomNodes.push(node)
				continue
			}
			rightNodes.push(node)
			continue
		}

		return {topNodes, rightNodes, bottomNodes, leftNodes}
	}

	public getSuggestions(): Suggestion[] {
		if (this.top.nodes.length < this.right.nodes.length) {
			this.top.setMaxPosition(100 - getNeededSpaceOfNode(this.right.nodes.at(0)?.node!).width)
		} else if (this.top.nodes.length > 0) {
			this.right.setMinPosition(getNeededSpaceOfNode(this.top.nodes.at(-1)?.node!).height)
		}
		if (this.top.nodes.length < this.left.nodes.length) {
			this.top.setMinPosition(getNeededSpaceOfNode(this.left.nodes.at(0)?.node!).width)
		} else if (this.top.nodes.length > 0) {
			this.left.setMinPosition(getNeededSpaceOfNode(this.top.nodes.at(0)?.node!).height)
		}
		if (this.bottom.nodes.length < this.right.nodes.length) {
			this.bottom.setMaxPosition(100 - getNeededSpaceOfNode(this.right.nodes.at(-1)?.node!).width)
		} else if (this.bottom.nodes.length > 0) {
			this.right.setMaxPosition(100 - getNeededSpaceOfNode(this.bottom.nodes.at(-1)?.node!).height)
		}
		if (this.bottom.nodes.length < this.left.nodes.length) {
			this.bottom.setMinPosition(getNeededSpaceOfNode(this.left.nodes.at(-1)?.node!).width)
		} else if (this.bottom.nodes.length > 0) {
			this.left.setMaxPosition(100 - getNeededSpaceOfNode(this.bottom.nodes.at(0)?.node!).height)
		}
		return [
			...this.top.getSuggestions(),
			...this.right.getSuggestions(),
			...this.bottom.getSuggestions(),
			...this.left.getSuggestions()
		]

		function getNeededSpaceOfNode(node: Box|NodeWidget): {width: number, height: number} {
			if (node instanceof Box) {
				return node.getLocalRectToSave()
			}
			return {width: 8, height: 8}
		}
	}
}