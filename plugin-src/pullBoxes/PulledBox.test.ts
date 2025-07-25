import { ClientRect } from '../../dist/core/ClientRect'
import { PulledBox } from './PulledBox'

test('fitRectPreservingAspectRatio', () => {
	const pulledBox = new PulledBox(null!, null!, null)
	expect(pulledBox.fitRectPreservingAspectRatio(new ClientRect(0, 0, 100, 100), 1)).toEqual(new ClientRect(0, 0, 100, 100))
	expect(pulledBox.fitRectPreservingAspectRatio(new ClientRect(0, 0, 100, 100), 2)).toEqual(new ClientRect(0, 25, 100, 50))
	expect(pulledBox.fitRectPreservingAspectRatio(new ClientRect(0, 0, 100, 100), 0.5)).toEqual(new ClientRect(25, 0, 50, 100))
	expect(pulledBox.fitRectPreservingAspectRatio(new ClientRect(0, 0, 200, 100), 2)).toEqual(new ClientRect(0, 0, 200, 100))
	expect(pulledBox.fitRectPreservingAspectRatio(new ClientRect(0, 0, 300, 100), 2)).toEqual(new ClientRect(50, 0, 200, 100))
	expect(pulledBox.fitRectPreservingAspectRatio(new ClientRect(0, 0, 300, 100), 0.5)).toEqual(new ClientRect(125, 0, 50, 100))
})

test('calculateLeastTransformedRectToSurround', () => {
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(1000, 300, 400, 200), new ClientRect(600, 350, 200, 100))).toEqual(new ClientRect(600, 300, 400, 200))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(-600, 300, 400, 200), new ClientRect(0, 350, 200, 100))).toEqual(new ClientRect(-200, 300, 400, 200))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(1000, 350, 200, 100), new ClientRect(400, 300, 400, 200))).toEqual(new ClientRect(400, 300, 400, 200))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(-400, 350, 200, 100), new ClientRect(0, 300, 400, 200))).toEqual(new ClientRect(0, 300, 400, 200))
})