import { Box } from '../../dist/core/box/Box'
import { LinkEnd } from '../../dist/core/link/LinkEnd'
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

	public abstract addNodeIfFitting(node: Box|NodeWidget): Promise<{added: boolean}>

	public async getTargetPositionsOfNodeLinks(node: Box|NodeWidget): Promise<LocalPosition[]> {
		const positions: LocalPosition[] = []
		for (const linkEnd of node.borderingLinks.getAllEnds()) {
			for (const layerNode of this.nodes) {
				const otherEnd: LinkEnd = linkEnd.getOtherEnd()
				if (otherEnd.isBoxInPath(layerNode.node)) {
					positions.push(await otherEnd.getTargetPositionInManagingBoxCoords())
				}
			}
		}
		return positions
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