import { LayerSide, Suggestion } from './LayerSide'
import { NodeToOrder } from './NodeToOrder'

export class Layer {
	public nodes: NodeToOrder[]
	public top: LayerSide
	public right: LayerSide
	public bottom: LayerSide
	public left: LayerSide

	public constructor(nodes: NodeToOrder[], outerDistances: {toTop: number, toRight: number, toBottom: number, toLeft: number}) {
		this.nodes = nodes
		const classifiedNodes = this.classifyNodes()
		this.top = new LayerSide('top', outerDistances.toTop, outerDistances.toLeft, 100-outerDistances.toRight, classifiedNodes.topNodes)
		this.right = new LayerSide('right', outerDistances.toRight, outerDistances.toTop, 100-outerDistances.toBottom,  classifiedNodes.rightNodes)
		this.bottom = new LayerSide('bottom', outerDistances.toBottom, outerDistances.toLeft, 100-outerDistances.toRight, classifiedNodes.bottomNodes)
		this.left = new LayerSide('left', outerDistances.toLeft, outerDistances.toTop, 100-outerDistances.toBottom, classifiedNodes.leftNodes)
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
			this.top.decreaseMaxPosition(this.right.calculateThicknessAfterScale())
		} else if (this.top.nodes.length > 0) {
			this.right.increaseMinPosition(this.top.calculateThicknessAfterScale())
		}
		if (this.top.nodes.length < this.left.nodes.length) {
			this.top.increaseMinPosition(this.left.calculateThicknessAfterScale())
		} else if (this.top.nodes.length > 0) {
			this.left.increaseMinPosition(this.top.calculateThicknessAfterScale())
		}
		if (this.bottom.nodes.length < this.right.nodes.length) {
			this.bottom.decreaseMaxPosition(this.right.calculateThicknessAfterScale())
		} else if (this.bottom.nodes.length > 0) {
			this.right.decreaseMaxPosition(this.bottom.calculateThicknessAfterScale())
		}
		if (this.bottom.nodes.length < this.left.nodes.length) {
			this.bottom.increaseMinPosition(this.left.calculateThicknessAfterScale())
		} else if (this.bottom.nodes.length > 0) {
			this.left.decreaseMaxPosition(this.bottom.calculateThicknessAfterScale())
		}
		return [
			...this.top.getSuggestions(),
			...this.right.getSuggestions(),
			...this.bottom.getSuggestions(),
			...this.left.getSuggestions()
		]
	}

	public calculateInnerDistances(): {toTop: number, toRight: number, toBottom: number, toLeft: number} {
		return {
			toTop: this.top.calculateInnerDistanceToSide(),
			toRight: this.right.calculateInnerDistanceToSide(),
			toBottom: this.bottom.calculateInnerDistanceToSide(),
			toLeft: this.left.calculateInnerDistanceToSide()
		}
	}
}