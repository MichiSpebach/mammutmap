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