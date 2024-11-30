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
		
		this.top = new LayerSide('top', classifiedNodes.topNodes, outerDistances.toTop)
		this.right = new LayerSide('right', classifiedNodes.rightNodes, outerDistances.toRight)
		this.bottom = new LayerSide('bottom', classifiedNodes.bottomNodes, outerDistances.toBottom)
		this.left = new LayerSide('left', classifiedNodes.leftNodes, outerDistances.toLeft)
		
		this.setDistances({
			...outerDistances,
			innerToTop: this.top.innerDistanceToSide,
			innerToRight: this.right.innerDistanceToSide,
			innerToBottom: this.bottom.innerDistanceToSide,
			innerToLeft: this.left.innerDistanceToSide
		})
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
		return [
			...this.top.getSuggestions(),
			...this.right.getSuggestions(),
			...this.bottom.getSuggestions(),
			...this.left.getSuggestions()
		]
	}

	public getInnerDistances(): {toTop: number, toRight: number, toBottom: number, toLeft: number} {
		return {
			toTop: this.top.innerDistanceToSide,
			toRight: this.right.innerDistanceToSide,
			toBottom: this.bottom.innerDistanceToSide,
			toLeft: this.left.innerDistanceToSide
		}
	}

	public setDistances(distances: {
		toTop: number, innerToTop: number
		toRight: number, innerToRight: number
		toBottom: number, innerToBottom: number
		toLeft: number, innerToLeft: number
	}): void {
		let topMinPosition: number = distances.toLeft
		let topMaxPosition: number = 100-distances.toRight
		let rightMinPosition: number = distances.toTop
		let rightMaxPosition: number = 100-distances.toBottom
		let bottomMinPosition: number = distances.toLeft
		let bottomMaxPosition: number = 100-distances.toRight
		let leftMinPosition: number = distances.toTop
		let leftMaxPosition: number = 100-distances.toBottom

		const rightThickness: number = distances.innerToRight-distances.toRight
		const topThickness: number = distances.innerToTop-distances.toTop
		const leftThickness: number = distances.innerToLeft-distances.toLeft
		const bottomThickness: number = distances.innerToBottom-distances.toBottom

		if (this.top.nodes.length < this.right.nodes.length) {
			topMaxPosition -= rightThickness
		} else if (this.top.nodes.length > 0) {
			rightMinPosition += topThickness
		}
		if (this.top.nodes.length < this.left.nodes.length) {
			topMinPosition += leftThickness
		} else if (this.top.nodes.length > 0) {
			leftMinPosition += topThickness
		}
		if (this.bottom.nodes.length < this.right.nodes.length) {
			bottomMaxPosition -= rightThickness
		} else if (this.bottom.nodes.length > 0) {
			rightMaxPosition -= bottomThickness
		}
		if (this.bottom.nodes.length < this.left.nodes.length) {
			bottomMinPosition += leftThickness
		} else if (this.bottom.nodes.length > 0) {
			leftMaxPosition -= bottomThickness
		}

		this.top.setDistances({
			distanceToSide: distances.toTop,
			innerDistanceToSide: distances.innerToTop,
			minPositionAlongSide: topMinPosition,
			maxPositionAlongSide: topMaxPosition
		})
		this.right.setDistances({
			distanceToSide: distances.toRight,
			innerDistanceToSide: distances.innerToRight,
			minPositionAlongSide: rightMinPosition,
			maxPositionAlongSide: rightMaxPosition
		})
		this.bottom.setDistances({
			distanceToSide: distances.toBottom,
			innerDistanceToSide: distances.innerToBottom,
			minPositionAlongSide: bottomMinPosition,
			maxPositionAlongSide: bottomMaxPosition
		})
		this.left.setDistances({
			distanceToSide: distances.toLeft,
			innerDistanceToSide: distances.innerToLeft,
			minPositionAlongSide: leftMinPosition,
			maxPositionAlongSide: leftMaxPosition
		})
	}
}