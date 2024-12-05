import { Box } from '../../dist/core/box/Box'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import { LayerSide, Suggestion } from './LayerSide'
import { NodeToOrder } from './NodeToOrder'

export abstract class Layer {
	public nodes: NodeToOrder[] = []
	
	public constructor(
		public top: LayerSide,
		public right: LayerSide,
		public bottom: LayerSide,
		public left: LayerSide,
	) {}

	public getInnerDistances(): {toTop: number, toRight: number, toBottom: number, toLeft: number} {
		return {
			toTop: this.top.calculateInnerDistanceToSide(),
			toRight: this.right.calculateInnerDistanceToSide(),
			toBottom: this.bottom.calculateInnerDistanceToSide(),
			toLeft: this.left.calculateInnerDistanceToSide()
		}
	}

	public abstract addNodeIfFitting(node: Box|NodeWidget): {added: boolean}

	public getIntersectionsOfNodeLinks(node: Box|NodeWidget): LocalPosition[] {
		const intersections: LocalPosition[] = []
		
		for (const linkEnd of node.borderingLinks.getAllEnds()) {
			for (const layerNode of this.nodes) {
				if (linkEnd.getOtherEnd().isBoxInPath(layerNode.node)) {
					intersections.push(layerNode.wishPosition/*TODO: calculateLinkEndPositionInBox(..)*/)
				}
			}
		}

		return intersections
	}

	public getSuggestions(): Suggestion[] {
		return [
			...this.top.getSuggestions(),
			...this.right.getSuggestions(),
			...this.bottom.getSuggestions(),
			...this.left.getSuggestions()
		]
	}

	/** TODO: move into Position? */
	public calculateAvaragePosition(positions: LocalPosition[]): LocalPosition {
		let x = 0
		let y = 0
		for (const position of positions) {
			x += position.percentX
			y += position.percentY
		}
		return new LocalPosition(x/positions.length, y/positions.length)
	}
}