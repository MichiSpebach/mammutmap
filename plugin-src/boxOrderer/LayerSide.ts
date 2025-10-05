import { Box } from '../../src/core/box/Box'
import { LocalRect } from '../../src/core/LocalRect'
import { NodeWidget } from '../../src/core/node/NodeWidget'
import { LocalPosition } from '../../src/core/shape/LocalPosition'
import { NodeToOrder } from './NodeToOrder'
import { Sorting } from './Sorting'

export type Suggestion = {
	node: Box|NodeWidget
	suggestedPosition: LocalPosition
	suggestedSize?: {width: number, height: number}
}

export class LayerSide {
	public static marginFactor: number = 1.5
	public static nodeWidgetDiameter: number = 8

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

	public getRect(): LocalRect {
		switch (this.side) {
			case 'left':
				return new LocalRect(this.distanceToSide, this.minPositionAlongSide, this.calculateThickness(), this.maxPositionAlongSide-this.minPositionAlongSide)
			case 'right':
				return new LocalRect(100-this.calculateInnerDistanceToSide(), this.minPositionAlongSide, this.calculateThickness(), this.maxPositionAlongSide-this.minPositionAlongSide)
			case 'top':
				return new LocalRect(this.minPositionAlongSide, this.distanceToSide, this.maxPositionAlongSide-this.minPositionAlongSide, this.calculateThickness())
			case 'bottom':
				return new LocalRect(this.minPositionAlongSide, 100-this.calculateInnerDistanceToSide(), this.maxPositionAlongSide-this.minPositionAlongSide, this.calculateThickness())
		}
	}

	public getSuggestions(): Suggestion[] {
		const sorting = new Sorting(this.minPositionAlongSide, this.maxPositionAlongSide)
		for (const node of this.nodes) {
			const positionAlongSide: number = this.getPositionAlongSide(node.wishPosition)
			const spaceAlongSide: number = this.getWishedSpaceForNode(node.node).alongSide * this.calculateScaleForNode(node.node)
			sorting.addItem({node: node.node, position: positionAlongSide - spaceAlongSide/2, size: spaceAlongSide})
		}
		
		sorting.sort()

		const suggestions: Suggestion[] = []
		for (const item of sorting.items) {
			const scale: number = this.calculateScaleForNode(item.node)
			if (!(item.node instanceof Box)) {
				suggestions.push({node: item.node, suggestedPosition: this.getPosition(item.position + LayerSide.nodeWidgetDiameter*scale/2)})
				continue
			}
			let rect: {width: number, height: number} = item.node.getLocalRectToSave()
			if (scale !== 1) {
				rect = {
					width: rect.width*scale,
					height: rect.height*scale
				}
			}
			const size: {alongSide: number, orthogonalToSide: number} = this.getSize(rect)
			const marginAlongSide: number = (size.alongSide*LayerSide.marginFactor - size.alongSide)/2
			suggestions.push({node: item.node, suggestedPosition: this.getPosition(item.position + marginAlongSide, rect), suggestedSize: scale !== 1 ? rect : undefined})
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

	private getPositionAlongSide(position: LocalPosition): number {
		if (this.side === 'top' || this.side === 'bottom') {
			return position.percentX
		}
		return position.percentY
	}

	private getSize(rect: {width: number, height: number}): {alongSide: number, orthogonalToSide: number} {
		if (this.side === 'top' || this.side === 'bottom') {
			return {alongSide: rect.width, orthogonalToSide: rect.height}
		}
		return {alongSide: rect.height, orthogonalToSide: rect.width}
	}

	private calculateScaleForNode(node: Box|NodeWidget): number {
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
			const neededSpace: {alongSide: number, orthogonalToSide: number} = this.getWishedSpaceForNode(node.node)
			sumAlongSide += neededSpace.alongSide
			if (neededSpace.orthogonalToSide > maxOrthogonalToSide) {
				maxOrthogonalToSide = neededSpace.orthogonalToSide
			}
		}

		return {alongSide: sumAlongSide, orthogonalToSide: maxOrthogonalToSide}
	}

	private getWishedSpaceForNode(node: Box|NodeWidget): {alongSide: number, orthogonalToSide: number} {
		if (!(node instanceof Box)) {
			return {alongSide: LayerSide.nodeWidgetDiameter, orthogonalToSide: LayerSide.nodeWidgetDiameter}
		}

		const rect: LocalRect = node.getLocalRectToSave()
		if (this.side === 'top' || this.side === 'bottom') {
			return {alongSide: rect.width*LayerSide.marginFactor, orthogonalToSide: rect.height*LayerSide.marginFactor}
		}
		return {alongSide: rect.height*LayerSide.marginFactor, orthogonalToSide: rect.width*LayerSide.marginFactor}
	}

	private getAvailableSpaceAlongSide(): number {
		return this.maxPositionAlongSide - this.minPositionAlongSide
	}
}