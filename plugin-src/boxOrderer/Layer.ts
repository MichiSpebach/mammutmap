import { Box } from '../../src/core/box/Box'
import { LinkEnd } from '../../src/core/link/LinkEnd'
import { NodeWidget } from '../../src/core/node/NodeWidget'
import { LocalPosition } from '../../src/core/shape/LocalPosition'
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

	public async addNodeIfFitting(node: Box|NodeWidget, options?: {mode?: 'count'|'average'}): Promise<{added: boolean}> {
		const targets: {side: LayerSide, position: LocalPosition}[] = await this.getOuterTargetsOfNodeLinks(node)
		if (targets.length < 1) {
			return {added: false}
		}
		
		const wishPosition: LocalPosition = this.calculateAvaragePosition(targets.map(target => target.position))
		let bestSide: LayerSide
		if (options?.mode === 'average') {
			bestSide = this.left
			let distanceToBestSide: number = wishPosition.percentX - this.left.distanceToSide
			const distanceToRight: number = 100-this.right.distanceToSide - wishPosition.percentX
			if (distanceToRight < distanceToBestSide) {
				bestSide = this.right
				distanceToBestSide =  distanceToRight
			}
			const distanceToTop: number = wishPosition.percentY - this.top.distanceToSide
			if (distanceToTop < distanceToBestSide) {
				bestSide = this.top
				distanceToBestSide = distanceToTop
			}
			const distanceToBottom: number = 100-this.bottom.distanceToSide - wishPosition.percentY
			if (distanceToBottom < distanceToBestSide) {
				bestSide = this.bottom
				distanceToBestSide = distanceToBottom
			}
		} else {
			const counts = {left: 0, right: 0, top: 0, bottom: 0}
			for (const target of targets) {
				counts[target.side.side]++
			}
			bestSide = this.left
			let bestCount: number = counts.left
			for (const side of ['right', 'top', 'bottom']) {
				if (counts[side] > bestCount) {
					bestSide = this[side]
					bestCount = counts[side]
				}
			}
			if (bestCount < 1) {
				console.warn(`Layer::addNodeIfFitting() bestCount < 1, defaulting to this.left`)
			}
		}

		const nodeToOrder: NodeToOrder = {node, wishPosition}
		bestSide.nodes.push(nodeToOrder)
		this.nodes.push(nodeToOrder)
		this.updateExtremePositionsAlongSides()
		return {added: true}
	}

	public abstract getOuterTargetsOfNodeLinks(node: Box|NodeWidget): Promise<{side: LayerSide, position: LocalPosition}[]>

	public async getTargetsOfNodeLinks(node: Box|NodeWidget): Promise<{side: LayerSide, position: LocalPosition}[]> {
		const targets: {side: LayerSide, position: LocalPosition}[] = []
		for (const linkEnd of node.borderingLinks.getAllEnds()) {
			for (const side of [this.top, this.right, this.bottom, this.left]) {
				for (const sideNode of side.nodes) {
					const otherEnd: LinkEnd = linkEnd.getOtherEnd()
					if (otherEnd.isBoxInPath(sideNode.node)) {
						targets.push({side, position: await otherEnd.getTargetPositionInManagingBoxCoords()})
					}
				}
			}
		}
		return targets
	}

	protected abstract updateExtremePositionsAlongSides(): void

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