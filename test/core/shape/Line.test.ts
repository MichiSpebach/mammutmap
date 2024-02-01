import { ClientPosition } from '../../../src/core/shape/ClientPosition'
import { Line } from '../../../src/core/shape/Line'

test('elongate', () => {
	const topLeft: ClientPosition = new ClientPosition(100, 100)
	const bottomLeft: ClientPosition = new ClientPosition(100, 1900)
	const topRight: ClientPosition = new ClientPosition(3900, 100)
	const bottomRight: ClientPosition = new ClientPosition(3900, 1900)

	expect(new Line(topLeft, topRight).elongate(100)).toEqual({from: {x: 0, y: 100}, to: {x: 4000, y: 100}})
	expect(new Line(topRight, topLeft).elongate(100)).toEqual({from: {x: 4000, y: 100}, to: {x: 0, y: 100}})

	const topLeftToBottomRight = new Line(topLeft, bottomRight)
	const topLeftToBottomRightElongated = topLeftToBottomRight.elongate(100)
	expect(topLeftToBottomRightElongated.round(4)).toEqual({from: {x: 9.626, y: 57.19}, to: {x: 3990, y: 1943}})
	expect(topLeftToBottomRightElongated.getLength() - topLeftToBottomRight.getLength()).toBe(200)

	const bottomRightToTopLeft = new Line(bottomRight, topLeft)
	const bottomRightToTopLeftElongated = bottomRightToTopLeft.elongate(100)
	expect(bottomRightToTopLeftElongated.round(4)).toEqual({from: {x: 3990, y: 1943}, to: {x: 9.626, y: 57.19}})
	expect(bottomRightToTopLeftElongated.getLength() - bottomRightToTopLeft.getLength()).toBe(200)

	const bottomLeftToTopRight = new Line(bottomLeft, topRight)
	const bottomLeftToTopRightElongated = bottomLeftToTopRight.elongate(100)
	expect(bottomLeftToTopRightElongated.round(4)).toEqual({from: {x: 9.626, y: 1943}, to: {x: 3990, y: 57.19}})
	expect(bottomLeftToTopRightElongated.getLength() - bottomLeftToTopRight.getLength()).toBe(200)

	const topRightToBottomLeft = new Line(topRight, bottomLeft)
	const topRightToBottomLeftElongated = topRightToBottomLeft.elongate(100)
	expect(topRightToBottomLeftElongated.round(4)).toEqual({from: {x: 3990, y: 57.19}, to: {x: 9.626, y: 1943}})
	expect(topRightToBottomLeftElongated.getLength() - topRightToBottomLeft.getLength()).toBe(200)

	expect(new Line(topLeft, bottomLeft).elongate(100)).toEqual({from: {x: 100, y: 0}, to: {x: 100, y: 2000}})
	expect(new Line(bottomLeft, topLeft).elongate(100)).toEqual({from: {x: 100, y: 2000}, to: {x: 100, y: 0}})
})
