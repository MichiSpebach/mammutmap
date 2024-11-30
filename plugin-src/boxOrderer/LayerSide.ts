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
	public static marginFactor: number = 1.5

	public side: 'top'|'right'|'bottom'|'left'
	public nodes: NodeToOrder[]
	public distanceToSide: number
	public innerDistanceToSide: number
	public minPositionAlongSide: number = 0
	public maxPositionAlongSide: number = 100

	public constructor(side: 'top'|'right'|'bottom'|'left', nodes: NodeToOrder[], distanceToSide: number) {
		this.side = side
		
		this.nodes = nodes
		if (this.side === 'top' || this.side === 'bottom') {
			this.nodes.sort((a: NodeToOrder, b: NodeToOrder) => a.wishPosition.percentX - b.wishPosition.percentX)
		} else {
			this.nodes.sort((a: NodeToOrder, b: NodeToOrder) => a.wishPosition.percentY - b.wishPosition.percentY)
		}
		
		this.distanceToSide = distanceToSide
		this.innerDistanceToSide = this.distanceToSide + this.getWishedSpace().orthogonalToSide
	}

	public setDistances(options: {
		distanceToSide: number
		innerDistanceToSide: number
		minPositionAlongSide: number
		maxPositionAlongSide: number
	}): void {
		this.distanceToSide = options.distanceToSide
		this.innerDistanceToSide = options.innerDistanceToSide
		this.minPositionAlongSide = options.minPositionAlongSide
		this.maxPositionAlongSide = options.maxPositionAlongSide
	}

	public calculateThickness(): number {
		return Math.abs(this.innerDistanceToSide - this.distanceToSide)
	}

	public getSuggestions(): Suggestion[] {
		const suggestions: Suggestion[] = []
		let nextFreePosition: number = this.minPositionAlongSide
		for (const node of this.nodes) {
			const scale: number = this.calculateScaleForNode(node)
			if (!(node.node instanceof Box)) {
				let distance: number = 8
				if (scale !== 1) {
					distance = distance*scale
				}
				suggestions.push({node: node.node, suggestedPosition: this.getPosition(nextFreePosition + distance/2)})
				nextFreePosition += distance
				continue
			}
			let rect: {width: number, height: number} = node.node.getLocalRectToSave()
			if (scale !== 1) {
				rect = {
					width: rect.width*scale,
					height: rect.height*scale
				}
			}
			const size: {alongSide: number, orthogonalToSide: number} = this.getSize(rect)
			suggestions.push({node: node.node, suggestedPosition: this.getPosition(nextFreePosition + size.alongSide*0.5, rect), suggestedSize: scale !== 1 ? rect : undefined})
			nextFreePosition += size.alongSide*1.5
		}
		return suggestions
	}

	private getPosition(valueAlongSide: number, rect?: {width: number, height: number}): LocalPosition {
		switch (this.side) {
			case 'top':
				return new LocalPosition(valueAlongSide, this.distanceToSide)
			case 'right':
				return new LocalPosition(100-this.distanceToSide-(rect?.width??0), valueAlongSide)
			case 'bottom':
				return new LocalPosition(valueAlongSide, 100-this.distanceToSide-(rect?.height??0))
			case 'left':
				return new LocalPosition(this.distanceToSide, valueAlongSide)
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

	private calculateScaleForNode(node: NodeToOrder): number {
		const wishedSpace = this.getWishedSpaceForNode(node)
		const scales: number[] = [1]
		
		const availableSpaceAlongSide: number = this.getAvailableSpaceAlongSide()
		if (availableSpaceAlongSide > 0 && wishedSpace.alongSide > 0) {
			const scaleAlongSide: number = availableSpaceAlongSide/wishedSpace.alongSide
			scales.push(scaleAlongSide)
		}
		
		let availableSpaceOrthogonalToSide = this.innerDistanceToSide - this.distanceToSide
		if (availableSpaceOrthogonalToSide <= 0) {
			console.log('availableSpaceOrthogonalToSide <= 0')
			availableSpaceOrthogonalToSide = -availableSpaceOrthogonalToSide
		}
		if (availableSpaceOrthogonalToSide > 0 && wishedSpace.orthogonalToSide > 0) {
			const scaleOrthogonalToSide: number = availableSpaceOrthogonalToSide/wishedSpace.orthogonalToSide
			scales.push(scaleOrthogonalToSide)
		}

		return Math.min(...scales)
	}

	public getWishedSpace(): {alongSide: number, orthogonalToSide: number} {
		let sumAlongSide: number = 0
		let maxOrthogonalToSide: number = 0
		
		for (const node of this.nodes) {
			const neededSpace: {alongSide: number, orthogonalToSide: number} = this.getWishedSpaceForNode(node)
			sumAlongSide += neededSpace.alongSide
			if (neededSpace.orthogonalToSide > maxOrthogonalToSide) {
				maxOrthogonalToSide = neededSpace.orthogonalToSide
			}
		}

		return {alongSide: sumAlongSide, orthogonalToSide: maxOrthogonalToSide}
	}

	private getWishedSpaceForNode(node: NodeToOrder): {alongSide: number, orthogonalToSide: number} {
		if (!(node.node instanceof Box)) {
			return {alongSide: 8, orthogonalToSide: 8}
		}

		const rect: LocalRect = node.node.getLocalRectToSave()
		if (this.side === 'top' || this.side === 'bottom') {
			return {alongSide: rect.width*LayerSide.marginFactor, orthogonalToSide: rect.height*LayerSide.marginFactor}
		}
		return {alongSide: rect.height*LayerSide.marginFactor, orthogonalToSide: rect.width*LayerSide.marginFactor}
	}

	private getAvailableSpaceAlongSide(): number {
		return 100 - this.minPositionAlongSide - (100-this.maxPositionAlongSide)
	}
}