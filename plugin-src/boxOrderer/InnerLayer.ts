import { Box } from '../../dist/core/box/Box'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import { Layer } from './Layer'
import { LayerSide } from './LayerSide'
import { NodeToOrder } from './NodeToOrder'

export class InnerLayer extends Layer {
	public outerLayer: Layer

	public constructor(outerLayer: Layer) {
		super(
			new LayerSide('top', outerLayer.top.calculateInnerDistanceToSide()),
			new LayerSide('right', outerLayer.right.calculateInnerDistanceToSide()),
			new LayerSide('bottom', outerLayer.bottom.calculateInnerDistanceToSide()),
			new LayerSide('left', outerLayer.left.calculateInnerDistanceToSide())
		)
		this.outerLayer = outerLayer
		
		this.updateExtremePositionsAlongSides()
	}

	public getOuterDistances(): {toTop: number, toRight: number, toBottom: number, toLeft: number} {
		return {
			toTop: this.top.distanceToSide,
			toRight: this.right.distanceToSide,
			toBottom: this.bottom.distanceToSide,
			toLeft: this.left.distanceToSide
		}
	}

	public override async addNodeIfFitting(node: Box|NodeWidget, options?: {mode?: 'count'|'average'}): Promise<{ added: boolean} > {
		const intersections: LocalPosition[] = await this.outerLayer.getTargetPositionsOfNodeLinks(node)
		if (intersections.length < 1) {
			return {added: false}
		}
		
		const intersection: LocalPosition = this.calculateAvaragePosition(intersections)
		let bestSide: LayerSide
		if (options?.mode === 'average') {
			bestSide = this.left
			let distanceToBestSide: number = intersection.percentX - this.left.distanceToSide
			const distanceToRight: number = 100-this.right.distanceToSide - intersection.percentX
			if (distanceToRight < distanceToBestSide) {
				bestSide = this.right
				distanceToBestSide =  distanceToRight
			}
			const distanceToTop: number = intersection.percentY - this.top.distanceToSide
			if (distanceToTop < distanceToBestSide) {
				bestSide = this.top
				distanceToBestSide = distanceToTop
			}
			const distanceToBottom: number = 100-this.bottom.distanceToSide - intersection.percentY
			if (distanceToBottom < distanceToBestSide) {
				bestSide = this.bottom
				distanceToBestSide = distanceToBottom
			}
		} else {
			const outerDistances = this.getOuterDistances()
			const counts = {left: 0, right: 0, top: 0, bottom: 0}
			for (const intersection of intersections) {
				if (intersection.percentX < outerDistances.toLeft + 0.1) {
					counts.left++
					continue
				}
				if (intersection.percentX > 100-outerDistances.toRight - 0.1) {
					counts.right++
					continue
				}
				if (intersection.percentY < outerDistances.toTop + 0.1) {
					counts.top++
					continue
				}
				if (intersection.percentY > 100-outerDistances.toBottom - 0.1) {
					counts.bottom++
					continue
				}
			}
			bestSide = this.left
			let bestCount: number = counts.left
			if (counts.right > bestCount) {
				bestSide = this.right
				bestCount = counts.right
			}
			if (counts.top > bestCount) {
				bestSide = this.top
				bestCount = counts.top
			}
			if (counts.bottom > bestCount) {
				bestSide = this.bottom
				bestCount = counts.bottom
			}
			if (bestCount < 1) {
				console.warn(`InnerLayer::addNodeIfFitting() bestCount < 1, defaulting to this.left`)
			}
		}

		const nodeToOrder: NodeToOrder = {node, wishPosition: intersection}
		bestSide.nodes.push(nodeToOrder)
		this.nodes.push(nodeToOrder)
		this.updateExtremePositionsAlongSides()
		return {added: true}
	}

	public updateDimensions(): void {
		this.top.distanceToSide = this.outerLayer.top.calculateInnerDistanceToSide()
		this.right.distanceToSide = this.outerLayer.right.calculateInnerDistanceToSide()
		this.bottom.distanceToSide = this.outerLayer.bottom.calculateInnerDistanceToSide()
		this.left.distanceToSide = this.outerLayer.left.calculateInnerDistanceToSide()
		this.updateExtremePositionsAlongSides()
	}

	private updateExtremePositionsAlongSides(): void {
		let topMinPosition: number = this.left.distanceToSide
		let topMaxPosition: number = 100-this.right.distanceToSide
		let rightMinPosition: number = this.top.distanceToSide
		let rightMaxPosition: number = 100-this.bottom.distanceToSide
		let bottomMinPosition: number = this.left.distanceToSide
		let bottomMaxPosition: number = 100-this.right.distanceToSide
		let leftMinPosition: number = this.top.distanceToSide
		let leftMaxPosition: number = 100-this.bottom.distanceToSide

		if (this.top.nodes.length < this.right.nodes.length) {
			topMaxPosition -= this.right.calculateThickness()
		} else if (this.top.nodes.length > 0) {
			rightMinPosition += this.top.calculateThickness()
		}
		if (this.top.nodes.length < this.left.nodes.length) {
			topMinPosition += this.left.calculateThickness()
		} else if (this.top.nodes.length > 0) {
			leftMinPosition += this.top.calculateThickness()
		}
		if (this.bottom.nodes.length < this.right.nodes.length) {
			bottomMaxPosition -= this.right.calculateThickness()
		} else if (this.bottom.nodes.length > 0) {
			rightMaxPosition -= this.bottom.calculateThickness()
		}
		if (this.bottom.nodes.length < this.left.nodes.length) {
			bottomMinPosition += this.left.calculateThickness()
		} else if (this.bottom.nodes.length > 0) {
			leftMaxPosition -= this.bottom.calculateThickness()
		}

		if (topMinPosition < topMaxPosition) { // happens if no space is left but outerLayers are not scaled yet, TODO improve
			this.top.setExtremesAlongSide(topMinPosition, topMaxPosition)
		}
		if (rightMinPosition < rightMaxPosition) { // happens if no space is left but outerLayers are not scaled yet, TODO improve
			this.right.setExtremesAlongSide(rightMinPosition, rightMaxPosition)
		}
		if (bottomMinPosition < bottomMaxPosition) { // happens if no space is left but outerLayers are not scaled yet, TODO improve
			this.bottom.setExtremesAlongSide(bottomMinPosition, bottomMaxPosition)
		}
		if (leftMinPosition < leftMaxPosition) { // happens if no space is left but outerLayers are not scaled yet, TODO improve
			this.left.setExtremesAlongSide(leftMinPosition, leftMaxPosition)
		}
	}
}