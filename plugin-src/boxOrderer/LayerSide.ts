import { Box } from '../../dist/core/box/Box'
import { LocalRect } from '../../dist/core/LocalRect'
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

	public calculateThicknessAfterScale(): number {
		return this.getNeededSpace().orthogonalToSide * (this.calculateScale()?? 1) + 8
	}

	public getSuggestions(): Suggestion[] {
		const scale: number|undefined = this.calculateScale()
		
		const suggestions: Suggestion[] = []
		let nextFreePosition: number = this.minPosition
		for (const node of this.nodes) {
			if (!(node.node instanceof Box)) {
				let distance: number = 8
				if (scale) {
					distance = distance*scale
				}
				suggestions.push({node: node.node, suggestedPosition: this.getPosition(nextFreePosition + distance/2, 0)})
				nextFreePosition += distance
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
			suggestions.push({node: node.node, suggestedPosition: this.getPosition(nextFreePosition + size.alongSide*0.5, 8, rect), suggestedSize: scale ? rect : undefined})
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

	private calculateScale(): number|undefined {
		const neededSpace: number = this.getNeededSpace().alongSide
		const availableSpace: number = this.getAvailableSpaceAlongSide()
		return neededSpace > availableSpace ? availableSpace/neededSpace : undefined
	}

	private getNeededSpace(): {alongSide: number, orthogonalToSide: number} {
		let sumAlongSide: number = 0
		let maxOrthogonalToSide: number = 0
		
		for (const node of this.nodes) {
			const neededSpace: {alongSide: number, orthogonalToSide: number} = this.getNeededSpaceForNode(node)
			sumAlongSide += neededSpace.alongSide
			if (neededSpace.orthogonalToSide > maxOrthogonalToSide) {
				maxOrthogonalToSide = neededSpace.orthogonalToSide
			}
		}

		return {alongSide: sumAlongSide, orthogonalToSide: maxOrthogonalToSide}
	}

	private getNeededSpaceForNode(node: NodeToOrder): {alongSide: number, orthogonalToSide: number} {
		if (!(node.node instanceof Box)) {
			return {alongSide: 8, orthogonalToSide: 8}
		}

		const rect: LocalRect = node.node.getLocalRectToSave()
		if (this.side === 'top' || this.side === 'bottom') {
			return {alongSide: rect.height*1.5, orthogonalToSide: rect.width}
		}
		return {alongSide: rect.width*1.5, orthogonalToSide: rect.height}
	}

	private getAvailableSpaceAlongSide(): number {
		return 100 - this.minPosition - (100-this.maxPosition)
	}
}