import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import { LocalRect } from '../../dist/core/LocalRect'
import { Box } from '../../dist/core/box/Box'
import { LayerSide, Suggestion } from './LayerSide'
import { NodeToOrder } from './NodeToOrder'

test('getSuggestions', () => {
	expect(createLayerSide('top', 0, 0, 100, [
		createNodeToOrder('box', new LocalRect(40, 45, 20, 10))
	]).getSuggestions().map(toCompareData)).toEqual([
		{nodeName: 'box', suggestedPosition: new LocalPosition( 10, 0)}
	])

	expect(createLayerSide('top', 20, 20, 80, [
		createNodeToOrder('box', new LocalRect(40, 45, 20, 10))
	]).getSuggestions().map(toCompareData)).toEqual([
		{nodeName: 'box', suggestedPosition: new LocalPosition( 30, 20)}
	])

	expect(createLayerSide('top', 0, 0, 100, [
		createNodeToOrder('leftBox', new LocalRect(20, 45, 20, 10)),
		createNodeToOrder('rightBox', new LocalRect(60, 45, 20, 10))
	]).getSuggestions().map(toCompareData)).toEqual([
		{nodeName: 'leftBox', suggestedPosition: new LocalPosition( 10, 0)},
		{nodeName: 'rightBox', suggestedPosition: new LocalPosition( 40, 0)}
	])

	expect(createLayerSide('bottom', 0, 0, 100, [
		createNodeToOrder('rightBox', new LocalRect(60, 45, 20, 10)),
		createNodeToOrder('leftBox', new LocalRect(20, 45, 20, 10))
	]).getSuggestions().map(toCompareData)).toEqual([
		{nodeName: 'leftBox', suggestedPosition: new LocalPosition( 10, 90)},
		{nodeName: 'rightBox', suggestedPosition: new LocalPosition( 40, 90)}
	])
})

function createLayerSide(
	side: 'top'|'right'|'bottom'|'left',
	distanceToSide: number,
	minPosition: number, 
	maxPosition: number,
	nodes: NodeToOrder[]
): LayerSide {
	const layerSide = new LayerSide(side, distanceToSide)
	layerSide.nodes = nodes
	layerSide.setExtremesAlongSide(minPosition, maxPosition)
	return layerSide
}

function toCompareData(suggestion: Suggestion): {
	nodeName: string,
	suggestedPosition: LocalPosition,
	suggestedSize?: {width: number, height: number}
} {
	return {
		nodeName: suggestion.node.getName(),
		suggestedPosition: suggestion.suggestedPosition,
		suggestedSize: suggestion.suggestedSize
	}
}

function createNodeToOrder(name: string, rect: LocalRect): NodeToOrder {
	const node: Box = Object.setPrototypeOf({
		getName: () => name,
		getLocalRectToSave: () => rect
	}, Box.prototype)
	return {
		node,
		wishPosition: rect.getMidPosition()
	}
}