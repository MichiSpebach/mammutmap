import { Box } from '../../dist/core/box/Box'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import { NodeToOrder } from './NodeToOrder'

export type Suggestion = {
	node: Box|NodeWidget
	suggestedPosition: LocalPosition
	suggestedSize?: {width: number, height: number}
}

export class LayerSide {

	private minPosition: number = 4
	private maxPosition: number = 96

	public constructor(
		public side: 'top'|'right'|'bottom'|'left',
		public nodes: NodeToOrder[]
	) {
		if (this.side === 'top' || this.side === 'bottom') {
			this.nodes.sort((a: NodeToOrder, b: NodeToOrder) => a.wishPosition.percentX - b.wishPosition.percentX)
		} else {
			this.nodes.sort((a: NodeToOrder, b: NodeToOrder) => a.wishPosition.percentY - b.wishPosition.percentY)
		}
	}

	public setMinPosition(minPosition: number): void {
		this.minPosition = minPosition
	}

	public setMaxPosition(maxPosition: number): void {
		this.maxPosition = maxPosition
	}

	public getSuggestions(): Suggestion[] {
		const neededSpace: number = this.getNeededSpace()
		const availableSpace: number = this.getAvailableSpace()
		const scale: number|undefined = neededSpace > availableSpace ? availableSpace/neededSpace : undefined
		
		const suggestions: Suggestion[] = []
		let nextFreePosition: number = this.minPosition
		for (const node of this.nodes) {
			if (!(node.node instanceof Box)) {
				suggestions.push({node: node.node, suggestedPosition: this.getPosition(nextFreePosition+4, 0)})
				nextFreePosition += 8
				continue
			}
			let rect: {width: number, height: number} = node.node.getLocalRectToSave()
			if (scale) {
				rect = {
					width: rect.width*scale,
					height: rect.height*scale
				}
			}
			const size: {alongSide: number, orthogonalToSide: number} = this.getSize(rect)
			suggestions.push({node: node.node, suggestedPosition: this.getPosition(nextFreePosition + size.alongSide*0.25, 8, rect), suggestedSize: scale ? rect : undefined})
			nextFreePosition += size.alongSide*1.5
		}
		return suggestions
	}

	private getPosition(valueAlongSide: number, distanceToSide: number, rect?: {width: number, height: number}): LocalPosition {
		switch (this.side) {
			case 'top':
				return new LocalPosition(valueAlongSide, distanceToSide)
			case 'right':
				return new LocalPosition(100-distanceToSide-(rect?.width??0), valueAlongSide)
			case 'bottom':
				return new LocalPosition(valueAlongSide, 100-distanceToSide-(rect?.height??0))
			case 'left':
				return new LocalPosition(distanceToSide, valueAlongSide)
			default:
				console.warn(`side '${this.side}' is unknown, returning new LocalPosition(50, 50)`)
				return new LocalPosition(50, 50)
		}
	}

	private getSize(rect: {width: number, height: number}): {alongSide: number, orthogonalToSide: number} {
		if (this.side === 'top' || this.side === 'bottom') {
			return {alongSide: rect.width, orthogonalToSide: rect.height}
		}
		return {alongSide: rect.height, orthogonalToSide: rect.width}
	}

	private getNeededSpace(): number {
		let sum: number = 0
		for (const node of this.nodes) {
			sum += this.getNeededSpaceForNode(node)
		}
		return sum
	}

	private getNeededSpaceForNode(node: NodeToOrder): number {
		if (!(node.node instanceof Box)) {
			return 8
		}
		if (this.side === 'top' || this.side === 'bottom') {
			return node.node.getLocalRectToSave().height * 1.5
		}
		return node.node.getLocalRectToSave().width * 1.5
	}

	private getAvailableSpace(): number {
		return 100 - this.minPosition - (100-this.maxPosition)
	}
}