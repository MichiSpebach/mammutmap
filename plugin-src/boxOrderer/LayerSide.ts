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
	public nodes: NodeToOrder[] = []
	public distanceToSide: number
	public wishedThicknessWithoutNodes: number
	public maxThickness: number|undefined
	private minPositionAlongSide: number = 0
	private maxPositionAlongSide: number = 100

	public constructor(side: 'top'|'right'|'bottom'|'left', distanceToSide: number, wishedThicknessWithoutNodes: number = 0) {
		this.side = side
		this.distanceToSide = distanceToSide
		this.wishedThicknessWithoutNodes = wishedThicknessWithoutNodes
	}

	public setExtremesAlongSide(min: number, max: number): void {
		if (min > max) {
			console.warn(`LayerSide::setExtremesAlongSide(min: number, max: number) min > max`)
		}
		this.minPositionAlongSide = min
		this.maxPositionAlongSide = max
	}

	public setDistances(options: {
		distanceToSide: number
		innerDistanceToSide: number
		minPositionAlongSide: number
		maxPositionAlongSide: number
	}): void {
		this.distanceToSide = options.distanceToSide
		this.maxThickness = options.innerDistanceToSide - options.distanceToSide
		this.minPositionAlongSide = options.minPositionAlongSide
		this.maxPositionAlongSide = options.maxPositionAlongSide
	}

	public countConnectionsToNode(node: Box|NodeWidget): number {
		let count: number = 0
		for (const link of node.borderingLinks.getAll()) {
			for (const layerSideNode of this.nodes) {
				if (link.from.isBoxInPath(layerSideNode.node) || link.to.isBoxInPath(layerSideNode.node)) {
					count++
				}
			}
		}
		return count
	}

	public getSuggestions(): Suggestion[] {
		let sortedNodes: NodeToOrder[] = [...this.nodes]
		if (this.side === 'top' || this.side === 'bottom') {
			sortedNodes.sort((a: NodeToOrder, b: NodeToOrder) => a.wishPosition.percentX - b.wishPosition.percentX)
		} else {
			sortedNodes.sort((a: NodeToOrder, b: NodeToOrder) => a.wishPosition.percentY - b.wishPosition.percentY)
		}

		const suggestions: Suggestion[] = []
		let nextFreePosition: number = this.minPositionAlongSide
		for (const node of sortedNodes) {
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
				console.warn(`LayerSide::getPosition() '${this.side}' is unknown, returning new LocalPosition(50, 50)`)
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
		
		const sideThickness = this.calculateThickness()
		if (sideThickness > 0) {
			const scaleOrthogonalToSide: number = sideThickness/wishedSpace.orthogonalToSide
			scales.push(scaleOrthogonalToSide)
		}

		return Math.min(...scales)
	}

	public calculateInnerDistanceToSide(): number {
		return this.distanceToSide + this.calculateThickness()
	}

	public calculateThickness(): number {
		const wishedSpace = this.getWishedSpace()
		const thickness: number = wishedSpace.orthogonalToSide
		if (this.maxThickness && thickness > this.maxThickness) {
			return this.maxThickness
		}

		const availableSpaceAlongSide = this.getAvailableSpaceAlongSide()
		if (wishedSpace.alongSide > availableSpaceAlongSide) {
			return thickness / (wishedSpace.alongSide/availableSpaceAlongSide)
		}

		return thickness
	}

	public getWishedSpace(): {alongSide: number, orthogonalToSide: number} {
		let sumAlongSide: number = 0
		let maxOrthogonalToSide: number = this.wishedThicknessWithoutNodes
		
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
		return this.maxPositionAlongSide - this.minPositionAlongSide
	}
}