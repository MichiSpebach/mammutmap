import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import { Layer } from './Layer'
import { NodeToOrder } from './NodeToOrder'

test('Layer', async () => {
	const layer = new Layer([
		createNode({wishPosition: new LocalPosition(10, 0)}),
		createNode({wishPosition: new LocalPosition(50, 0)}),
		createNode({wishPosition: new LocalPosition(90, 0)}),
		createNode({wishPosition: new LocalPosition(10, 5)}),
		createNode({wishPosition: new LocalPosition(100, 10)}),
		createNode({wishPosition: new LocalPosition(100, 50)}),
		createNode({wishPosition: new LocalPosition(100, 90)}),
		createNode({wishPosition: new LocalPosition(95, 90)}),
		createNode({wishPosition: new LocalPosition(90, 100)}),
		createNode({wishPosition: new LocalPosition(50, 100)}),
		createNode({wishPosition: new LocalPosition(10, 100)}),
		createNode({wishPosition: new LocalPosition(0, 90)}),
		createNode({wishPosition: new LocalPosition(0, 50)}),
		createNode({wishPosition: new LocalPosition(0, 10)}),
	], {toTop: 0, toRight: 0, toBottom: 0, toLeft: 0})

	expect(layer.top.nodes.map(node => node.wishPosition.percentX)).toEqual([10, 10, 50, 90])
	expect(layer.right.nodes.map(node => node.wishPosition.percentY)).toEqual([10, 50, 90, 90])
	expect(layer.bottom.nodes.map(node => node.wishPosition.percentX)).toEqual([10, 50, 90])
	expect(layer.left.nodes.map(node => node.wishPosition.percentY)).toEqual([10, 50, 90])
})

function createNode(options: {wishPosition: LocalPosition}): NodeToOrder {
	return {
		node: {} as any,
		wishPosition: options.wishPosition
	}
}