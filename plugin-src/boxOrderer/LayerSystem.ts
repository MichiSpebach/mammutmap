import { Box } from '../../dist/core/box/Box'
import { EmptySpaceFinder } from '../../dist/core/box/EmptySpaceFinder'
import { FolderBox } from '../../dist/core/box/FolderBox'
import { Link } from '../../dist/core/link/Link'
import { LocalRect } from '../../dist/core/LocalRect'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { BorderLayer } from './BorderLayer'
import { InnerLayer } from './InnerLayer'
import { Layer } from './Layer'
import { LayerSide, Suggestion } from './LayerSide'

export class LayerSystem {
	public readonly box: FolderBox
	public layers: Layer[] = []
	public unassignedChildren: (Box|NodeWidget)[] = []

	public static async newAndAssignNodesToLayers(box: FolderBox): Promise<LayerSystem> {
		const layerSystem = new LayerSystem(box)
		await layerSystem.assignNodesToLayers()
		return layerSystem
	}

	private constructor(box: FolderBox) {
		this.box = box
	}

	private async assignNodesToLayers(): Promise<void> {
		this.layers = [await BorderLayer.new(this.box)]
		this.unassignedChildren = [...this.box.getChilds()]
		
		await this.assignUnassignedChildrenToLayers()
		await this.scatterUnassignedChildrenToFreeSpaces()
	}

	private async assignUnassignedChildrenToLayers(): Promise<void> {
		await this.assignUnassignedChildrenToLayer(this.layers[0])
		while (this.unassignedChildren.length > 0) {
			const newLayer = new InnerLayer(this.layers.at(-1)!)
			this.layers.push(newLayer)
			const unassignedChildrenBefore: number = this.unassignedChildren.length
			await this.assignUnassignedChildrenToLayer(newLayer)
			if (unassignedChildrenBefore === this.unassignedChildren.length) {
				break
			}
		}
	}

	private async assignUnassignedChildrenToLayer(layer: Layer): Promise<void> {
		for (let i = this.unassignedChildren.length-1; i >= 0; i--) { // counting down because elements are removed
			const child: Box|NodeWidget = this.unassignedChildren[i]
			if (layer.addNodeIfFitting(child).added) {
				this.unassignedChildren.splice(i, 1)
			}
		}

		if (this.scaleLayers().scaled) {
			await Promise.all(this.layers.map(layer => this.applySuggestions(layer)))
		} else {
			await this.applySuggestions(layer)
		}
	}

	private async applySuggestions(layer: Layer): Promise<void> {
		await Promise.all(layer.getSuggestions().map(async (suggestion: Suggestion) => {
			if (suggestion.node instanceof Box) {
				await suggestion.node.updateMeasuresAndBorderingLinks({
					x: suggestion.suggestedPosition.percentX,
					y: suggestion.suggestedPosition.percentY,
					width: suggestion.suggestedSize?.width,
					height: suggestion.suggestedSize?.height
				})
				await suggestion.node.saveMapData()
			} else {
				await suggestion.node.setPositionAndRenderAndSave(suggestion.suggestedPosition)
			}
		}))
	}

	private scaleLayers(): {scaled: boolean} {
		let wishedWidth: number = 0
		let wishedHeight: number = 0
		for (const layer of this.layers) {
			wishedWidth += layer.left.calculateThickness()
			wishedWidth += layer.right.calculateThickness()
			wishedHeight += layer.top.calculateThickness()
			wishedHeight += layer.bottom.calculateThickness()
		}
		if (wishedWidth <= 100 && wishedHeight <= 100) {
			return {scaled: false}
		}
		
		let maxHorizontalThickness: number = 100
		if (wishedWidth > 100) {
			let splittedLayers = this.splitLayerSidesByThickness(0, ['left', 'right'])
			let availableForTooThickLayerSides: number = 100-splittedLayers.thinnerOrEqual.combinedThickness
			maxHorizontalThickness = availableForTooThickLayerSides / splittedLayers.thicker.count
			
			splittedLayers = this.splitLayerSidesByThickness(maxHorizontalThickness, ['left', 'right'])
			availableForTooThickLayerSides = 100-splittedLayers.thinnerOrEqual.combinedThickness
			maxHorizontalThickness = availableForTooThickLayerSides / splittedLayers.thicker.count
		}
		let maxVerticalThickness: number = 100
		if (wishedWidth > 100) {
			let splittedLayers = this.splitLayerSidesByThickness(0, ['top', 'bottom'])
			let availableForTooThickLayerSides: number = 100-splittedLayers.thinnerOrEqual.combinedThickness
			maxVerticalThickness = availableForTooThickLayerSides / splittedLayers.thicker.count
			
			splittedLayers = this.splitLayerSidesByThickness(maxVerticalThickness, ['top', 'bottom'])
			availableForTooThickLayerSides = 100-splittedLayers.thinnerOrEqual.combinedThickness
			maxVerticalThickness = availableForTooThickLayerSides / splittedLayers.thicker.count
		}
		
		for (const layer of this.layers) {
			layer.top.maxThickness = maxVerticalThickness
			layer.right.maxThickness = maxHorizontalThickness
			layer.bottom.maxThickness = maxVerticalThickness
			layer.left.maxThickness = maxHorizontalThickness
			if (layer instanceof InnerLayer) {
				layer.updateDimensions()
			}
		}
		return {scaled: true}
	}

	private splitLayerSidesByThickness(thickness: number, sides: ('top'|'right'|'bottom'|'left')[]): {
		thicker: {count: number, combinedThickness: number}
		thinnerOrEqual: {count: number, combinedThickness: number}
	} {
		let result = {
			thicker: {count: 0, combinedThickness: 0},
			thinnerOrEqual: {count: 0, combinedThickness: 0}
		}
		for (const layer of this.layers) {
			for (const side of sides) {
				const sideThickness: number = layer[side].calculateThickness()
				if (sideThickness > thickness) {
					result.thicker.count++
					result.thicker.combinedThickness += sideThickness
				} else {
					result.thinnerOrEqual.count++
					result.thinnerOrEqual.combinedThickness += sideThickness
				}
			}
		}
		return result
	}

	private async scatterUnassignedChildrenToFreeSpaces(): Promise<void> {
		if (this.unassignedChildren.length < 1) {
			return
		}

		const occupiedSpaces: LocalRect[] = this.box.getChilds().filter(child => !this.unassignedChildren.includes(child)).map(child => {
			if (child instanceof Box) {
				return child.getLocalRectToSave()
			} else {
				return new LocalRect(child.getSavePosition().percentX-4, child.getSavePosition().percentY-4, 8, 8)
			}
		})
		const emptySpaces: LocalRect[] = new EmptySpaceFinder(occupiedSpaces).findEmptySpaces(this.unassignedChildren.length)
		await Promise.all(this.unassignedChildren.filter(child => child.isMapDataFileExisting()).map(async (child, index) => {
			if (child instanceof Box) {
				await child.updateMeasuresAndBorderingLinks({
					x: emptySpaces[index].x,
					y: emptySpaces[index].y,
					width: emptySpaces[index].width < child.getLocalRectToSave().width ? emptySpaces[index].width : undefined,
					height: emptySpaces[index].height < child.getLocalRectToSave().height ? emptySpaces[index].height : undefined
				})
				await child.saveMapData()
			} else {
				await child.setPositionAndRenderAndSave(emptySpaces[index].getMidPosition())
			}
		}))
		await this.box.rearrangeBoxesWithoutMapData()
	}
}