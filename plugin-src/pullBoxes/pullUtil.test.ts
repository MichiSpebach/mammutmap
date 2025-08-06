import { ClientRect } from '../../dist/core/ClientRect'
import * as pullUtil from './pullUtil'

test('calculateOverlap', () => {
	const rect = new ClientRect(200, 300, 400, 200)

	// right
	expect(pullUtil.calculateOverlap(rect, new ClientRect(550, 199, 150, 100), {x: 1, y: 0})).toEqual(undefined)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(550, 200, 150, 100), {x: 1, y: 0})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(550, 350, 150, 100), {x: 1, y: 0})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(550, 500, 150, 100), {x: 1, y: 0})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(550, 501, 150, 100), {x: 1, y: 0})).toEqual(undefined)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(100, 350, 150, 100), {x: 1, y: 0})).toEqual(500)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(650, 350, 150, 100), {x: 1, y: 0})).toEqual(undefined)

	// left
	expect(pullUtil.calculateOverlap(rect, new ClientRect(100, 199, 150, 100), {x: -1, y: 0})).toEqual(undefined)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(100, 200, 150, 100), {x: -1, y: 0})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(100, 350, 150, 100), {x: -1, y: 0})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(100, 500, 150, 100), {x: -1, y: 0})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(100, 501, 150, 100), {x: -1, y: 0})).toEqual(undefined)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(550, 350, 150, 100), {x: -1, y: 0})).toEqual(500)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(0, 350, 150, 100), {x: -1, y: 0})).toEqual(undefined)

	// bottom
	expect(pullUtil.calculateOverlap(rect, new ClientRect(49, 450, 150, 100), {x: 0, y: 1})).toEqual(undefined)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(50, 450, 150, 100), {x: 0, y: 1})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(325, 450, 150, 100), {x: 0, y: 1})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(600, 450, 150, 100), {x: 0, y: 1})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(601, 450, 150, 100), {x: 0, y: 1})).toEqual(undefined)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(325, 250, 150, 100), {x: 0, y: 1})).toEqual(250)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(325, 700, 150, 100), {x: 0, y: 1})).toEqual(undefined)

	// top
	expect(pullUtil.calculateOverlap(rect, new ClientRect(49, 250, 150, 100), {x: 0, y: -1})).toEqual(undefined)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(50, 250, 150, 100), {x: 0, y: -1})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(325, 250, 150, 100), {x: 0, y: -1})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(600, 250, 150, 100), {x: 0, y: -1})).toEqual(50)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(601, 250, 150, 100), {x: 0, y: -1})).toEqual(undefined)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(325, 450, 150, 100), {x: 0, y: -1})).toEqual(250)
	expect(pullUtil.calculateOverlap(rect, new ClientRect(325, 0, 150, 100), {x: 0, y: -1})).toEqual(undefined)
})

test('calculateDistance', () => {
	const rect = new ClientRect(200, 300, 400, 200)

	// to right
	expect(pullUtil.calculateDistance(rect, new ClientRect(650, 200, 150, 100), {x: 1, y: 0})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(650, 201, 150, 100), {x: 1, y: 0})).toEqual(50)
	expect(pullUtil.calculateDistance(rect, new ClientRect(650, 350, 150, 100), {x: 1, y: 0})).toEqual(50)
	expect(pullUtil.calculateDistance(rect, new ClientRect(650, 499, 150, 100), {x: 1, y: 0})).toEqual(50)
	expect(pullUtil.calculateDistance(rect, new ClientRect(650, 500, 150, 100), {x: 1, y: 0})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(0, 350, 150, 100), {x: 1, y: 0})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(550, 350, 150, 100), {x: 1, y: 0})).toEqual(undefined)

	// to left
	expect(pullUtil.calculateDistance(rect, new ClientRect(0, 200, 150, 100), {x: -1, y: 0})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(0, 201, 150, 100), {x: -1, y: 0})).toEqual(50)
	expect(pullUtil.calculateDistance(rect, new ClientRect(0, 350, 150, 100), {x: -1, y: 0})).toEqual(50)
	expect(pullUtil.calculateDistance(rect, new ClientRect(0, 499, 150, 100), {x: -1, y: 0})).toEqual(50)
	expect(pullUtil.calculateDistance(rect, new ClientRect(0, 500, 150, 100), {x: -1, y: 0})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(650, 350, 150, 100), {x: -1, y: 0})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(100, 350, 150, 100), {x: -1, y: 0})).toEqual(undefined)

	// to bottom
	expect(pullUtil.calculateDistance(rect, new ClientRect(50, 700, 150, 100), {x: 0, y: 1})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(51, 700, 150, 100), {x: 0, y: 1})).toEqual(200)
	expect(pullUtil.calculateDistance(rect, new ClientRect(325, 700, 150, 100), {x: 0, y: 1})).toEqual(200)
	expect(pullUtil.calculateDistance(rect, new ClientRect(599, 700, 150, 100), {x: 0, y: 1})).toEqual(200)
	expect(pullUtil.calculateDistance(rect, new ClientRect(600, 700, 150, 100), {x: 0, y: 1})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(325, 0, 150, 100), {x: 0, y: 1})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(325, 450, 150, 100), {x: 0, y: 1})).toEqual(undefined)

	// to top
	expect(pullUtil.calculateDistance(rect, new ClientRect(50, 0, 150, 100), {x: 0, y: -1})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(51, 0, 150, 100), {x: 0, y: -1})).toEqual(200)
	expect(pullUtil.calculateDistance(rect, new ClientRect(325, 0, 150, 100), {x: 0, y: -1})).toEqual(200)
	expect(pullUtil.calculateDistance(rect, new ClientRect(599, 0, 150, 100), {x: 0, y: -1})).toEqual(200)
	expect(pullUtil.calculateDistance(rect, new ClientRect(600, 0, 150, 100), {x: 0, y: -1})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(325, 700, 150, 100), {x: 0, y: -1})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(325, 250, 150, 100), {x: 0, y: -1})).toEqual(undefined)

	// to bottom right
	/*expect(pullUtil.calculateDistance(rect, new ClientRect(650, 150, 150, 100), {x: 1, y: 1})).toEqual(Math.sqrt(50*50 + 50*50))
	expect(pullUtil.calculateDistance(rect, new ClientRect(650, 350, 150, 100), {x: 1, y: 1})).toEqual(undefined)
	expect(pullUtil.calculateDistance(rect, new ClientRect(650, 550, 150, 100), {x: 1, y: 1})).toEqual(Math.sqrt(50*50 + 50*50))*/
})