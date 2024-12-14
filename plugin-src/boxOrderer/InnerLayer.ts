import { Box } from '../../dist/core/box/Box'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import { Layer } from './Layer'
import { LayerSide } from './LayerSide'

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

	public override async getOuterTargetsOfNodeLinks(node: Box|NodeWidget): Promise<{side: LayerSide, position: LocalPosition}[]> {
		return this.outerLayer.getTargetsOfNodeLinks(node)
	}

	public updateDimensions(): void {
		this.top.distanceToSide = this.outerLayer.top.calculateInnerDistanceToSide()
		this.right.distanceToSide = this.outerLayer.right.calculateInnerDistanceToSide()
		this.bottom.distanceToSide = this.outerLayer.bottom.calculateInnerDistanceToSide()
		this.left.distanceToSide = this.outerLayer.left.calculateInnerDistanceToSide()
		this.updateExtremePositionsAlongSides()
	}

	protected override updateExtremePositionsAlongSides(): void {
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