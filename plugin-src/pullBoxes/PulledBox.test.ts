import { ClientRect } from '../../dist/core/ClientRect'
import { PulledBox } from './PulledBox'

test('calculateLeastTransformedRectToSurround', () => {
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(1000, 300, 400, 200), new ClientRect(600, 350, 200, 100))).toEqual(new ClientRect(600, 300, 400, 200))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(-600, 300, 400, 200), new ClientRect(0, 350, 200, 100))).toEqual(new ClientRect(-200, 300, 400, 200))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(1000, 350, 200, 100), new ClientRect(400, 300, 400, 200))).toEqual(new ClientRect(400, 300, 400, 200))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(-400, 350, 200, 100), new ClientRect(0, 300, 400, 200))).toEqual(new ClientRect(0, 300, 400, 200))
})

test('calculateLeastTransformedRectToSurround preserveAspectRationIfPossible', () => {
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(1000, 300, 400, 200), new ClientRect(600, 350, 200, 100), {preserveAspectRationIfPossible: true})).toEqual(new ClientRect(600, 350, 200, 100))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(1000, 300, 400, 200), new ClientRect(600, 350, 100, 100), {preserveAspectRationIfPossible: true})).toEqual(new ClientRect(600, 350, 200, 100))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(-600, 300, 400, 200), new ClientRect(0, 350, 200, 100), {preserveAspectRationIfPossible: true})).toEqual(new ClientRect(0, 350, 200, 100))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(-600, 300, 400, 200), new ClientRect(0, 350, 100, 100), {preserveAspectRationIfPossible: true})).toEqual(new ClientRect(-100, 350, 200, 100))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(1000, 350, 200, 100), new ClientRect(400, 300, 400, 200), {preserveAspectRationIfPossible: true})).toEqual(new ClientRect(400, 300, 400, 200))
	expect(PulledBox.calculateLeastTransformedRectToSurround(new ClientRect(-400, 350, 200, 100), new ClientRect(0, 300, 400, 200), {preserveAspectRationIfPossible: true})).toEqual(new ClientRect(0, 300, 400, 200))
})